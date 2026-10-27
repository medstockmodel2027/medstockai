from datetime import date, timedelta
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.batch import Batch
from app.models.medicine import Medicine


# Isolated in-memory SQLite database for batch test execution
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    """Create fresh tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a transactional session for direct DB persistence assertions."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """TestClient with get_db dependency overridden to the isolated in-memory test DB."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_medicine(db_session) -> Medicine:
    """Create a persistent medicine record for testing batch associations."""
    med = Medicine(
        medicine_name="Amoxicillin 500mg",
        brand_name="Mox 500",
        generic_name="Amoxicillin Trihydrate",
        category="Antibiotics",
        unit="capsule",
        reorder_level=20,
    )
    db_session.add(med)
    db_session.commit()
    db_session.refresh(med)
    return med


@pytest.fixture
def second_medicine(db_session) -> Medicine:
    """Create a second medicine record to test cross-medicine batch number sharing."""
    med = Medicine(
        medicine_name="Paracetamol 650mg",
        brand_name="Dolo 650",
        generic_name="Paracetamol",
        category="Analgesics",
        unit="strip",
        reorder_level=50,
    )
    db_session.add(med)
    db_session.commit()
    db_session.refresh(med)
    return med


# ==============================================================================
# 1. Batch Registration & Retrieval Tests
# ==============================================================================

def test_create_batch_success(client, sample_medicine):
    """Verify successful batch registration with unit economics, dates, and stock initialization."""
    today = date.today()
    mfg_date = today - timedelta(days=60)
    exp_date = today + timedelta(days=365)

    payload = {
        "medicine_id": sample_medicine.id,
        "batch_number": "AMX-2026-001",
        "manufacturing_date": mfg_date.isoformat(),
        "expiry_date": exp_date.isoformat(),
        "quantity_received": 100,
        "purchase_price": "45.50",
        "mrp": "70.00",
        "supplier_name": "Cipla Logistics",
        "storage_location": "Rack A-12",
    }

    response = client.post("/api/batches", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["medicine_id"] == sample_medicine.id
    assert data["medicine_name"] == sample_medicine.medicine_name
    assert data["brand_name"] == sample_medicine.brand_name
    assert data["batch_number"] == "AMX-2026-001"
    assert data["quantity_received"] == 100
    assert data["current_stock"] == 100  # Initialized from quantity_received
    assert data["purchase_price"] == "45.50"
    assert data["mrp"] == "70.00"
    assert data["supplier_name"] == "Cipla Logistics"
    assert data["storage_location"] == "Rack A-12"
    assert data["is_expired"] is False
    assert data["expiry_status"] == "normal"
    assert data["days_until_expiry"] == (exp_date - today).days


def test_create_batch_missing_medicine_reference(client):
    """Verify that referencing a nonexistent medicine_id returns HTTP 404."""
    exp_date = date.today() + timedelta(days=180)
    payload = {
        "medicine_id": 99999,
        "batch_number": "GHOST-BATCH-1",
        "expiry_date": exp_date.isoformat(),
        "quantity_received": 50,
        "purchase_price": "10.00",
        "mrp": "15.00",
    }
    response = client.post("/api/batches", json=payload)
    assert response.status_code == 404
    assert "Medicine with id 99999 does not exist" in response.json()["detail"]


def test_create_batch_duplicate_case_insensitive(client, sample_medicine, second_medicine):
    """
    Verify case-insensitive duplicate batch prevention per medicine (409 Conflict),
    while permitting the same batch number on a different medicine.
    """
    exp_date = date.today() + timedelta(days=200)
    payload1 = {
        "medicine_id": sample_medicine.id,
        "batch_number": "BATCH-XYZ-100",
        "expiry_date": exp_date.isoformat(),
        "quantity_received": 50,
        "purchase_price": "20.00",
        "mrp": "30.00",
    }
    res1 = client.post("/api/batches", json=payload1)
    assert res1.status_code == 201

    # Exact duplicate attempt -> 409
    res2 = client.post("/api/batches", json=payload1)
    assert res2.status_code == 409
    assert "already exists for medicine" in res2.json()["detail"]

    # Case-insensitive duplicate attempt (lowercase with whitespace) -> 409
    payload_lower = {
        **payload1,
        "batch_number": "  batch-xyz-100  ",
    }
    res3 = client.post("/api/batches", json=payload_lower)
    assert res3.status_code == 409

    # Same batch number on a DIFFERENT medicine -> 201 Allowed
    payload_diff_med = {
        **payload1,
        "medicine_id": second_medicine.id,
    }
    res4 = client.post("/api/batches", json=payload_diff_med)
    assert res4.status_code == 201


def test_create_batch_validation_negative_quantity_and_pricing(client, sample_medicine):
    """Verify validation errors (422) for negative quantity received and negative prices."""
    exp_date = date.today() + timedelta(days=100)

    # Negative quantity
    res_neg_qty = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "B-NEG-1",
        "expiry_date": exp_date.isoformat(),
        "quantity_received": -10,
        "purchase_price": "10.00",
        "mrp": "15.00",
    })
    assert res_neg_qty.status_code == 422

    # Negative purchase price
    res_neg_price = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "B-NEG-2",
        "expiry_date": exp_date.isoformat(),
        "quantity_received": 10,
        "purchase_price": "-5.50",
        "mrp": "15.00",
    })
    assert res_neg_price.status_code == 422

    # Negative MRP
    res_neg_mrp = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "B-NEG-3",
        "expiry_date": exp_date.isoformat(),
        "quantity_received": 10,
        "purchase_price": "5.00",
        "mrp": "-1.00",
    })
    assert res_neg_mrp.status_code == 422

    # Blank batch number
    res_blank_batch = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "   ",
        "expiry_date": exp_date.isoformat(),
        "quantity_received": 10,
        "purchase_price": "5.00",
        "mrp": "10.00",
    })
    assert res_blank_batch.status_code == 422


def test_create_batch_invalid_date_ordering(client, sample_medicine):
    """Verify 422 error when expiry date is prior to manufacturing date."""
    today = date.today()
    payload = {
        "medicine_id": sample_medicine.id,
        "batch_number": "B-TIME-TRAVEL",
        "manufacturing_date": today.isoformat(),
        "expiry_date": (today - timedelta(days=30)).isoformat(),  # Expired before mfg
        "quantity_received": 10,
        "purchase_price": "10.00",
        "mrp": "15.00",
    }
    response = client.post("/api/batches", json=payload)
    assert response.status_code == 422
    assert "Expiry date cannot be earlier than manufacturing date" in response.text


def test_get_batch_by_id(client, sample_medicine):
    """Verify retrieval of existing batch by ID and 404 on missing batch."""
    exp = date.today() + timedelta(days=120)
    created = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "AMX-RETRIEVE",
        "expiry_date": exp.isoformat(),
        "quantity_received": 40,
        "purchase_price": "12.00",
        "mrp": "18.00",
    }).json()

    # Success
    res = client.get(f"/api/batches/{created['id']}")
    assert res.status_code == 200
    assert res.json()["batch_number"] == "AMX-RETRIEVE"
    assert res.json()["medicine_name"] == sample_medicine.medicine_name

    # Not found
    res_404 = client.get("/api/batches/88888")
    assert res_404.status_code == 404
    assert "Batch with id 88888 not found" in res_404.json()["detail"]


# ==============================================================================
# 2. Expiry Calculations & Date Boundary Tests
# ==============================================================================

def test_expiry_status_calculations_and_date_boundaries(client, sample_medicine):
    """
    Test precise operational shelf-life categories across date boundaries:
    - Expired yesterday (-1 day): status='expired', is_expired=True
    - Expires today (0 days): status='near_expiry', is_expired=False
    - Expires tomorrow (+1 day): status='near_expiry', is_expired=False
    - Expires in 90 days (+90 days): status='near_expiry', is_expired=False
    - Expires in 91 days (+91 days): status='normal', is_expired=False
    """
    today = date.today()
    cases = [
        ("B-EXPIRED", today - timedelta(days=1), -1, True, "expired"),
        ("B-TODAY", today, 0, False, "near_expiry"),
        ("B-TOMORROW", today + timedelta(days=1), 1, False, "near_expiry"),
        ("B-90-DAYS", today + timedelta(days=90), 90, False, "near_expiry"),
        ("B-91-DAYS", today + timedelta(days=91), 91, False, "normal"),
    ]

    for b_num, exp_d, expected_days, expected_is_exp, expected_status in cases:
        res = client.post("/api/batches", json={
            "medicine_id": sample_medicine.id,
            "batch_number": b_num,
            "expiry_date": exp_d.isoformat(),
            "quantity_received": 10,
            "purchase_price": "10.00",
            "mrp": "15.00",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["days_until_expiry"] == expected_days
        assert data["is_expired"] is expected_is_exp
        assert data["expiry_status"] == expected_status


# ==============================================================================
# 3. Listing, Pagination, and Filter Tests
# ==============================================================================

def test_list_batches_fefo_sorting_and_pagination(client, sample_medicine):
    """Verify FEFO (First Expiry First Out) ordering and pagination parameters."""
    today = date.today()
    # Insert batches out of order
    for b_num, days in [("LATER", 180), ("EARLIEST", 10), ("MIDDLE", 60)]:
        client.post("/api/batches", json={
            "medicine_id": sample_medicine.id,
            "batch_number": b_num,
            "expiry_date": (today + timedelta(days=days)).isoformat(),
            "quantity_received": 20,
            "purchase_price": "10.00",
            "mrp": "15.00",
        })

    # List all
    res = client.get("/api/batches")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    # Check FEFO order
    batch_nums = [b["batch_number"] for b in data["items"]]
    assert batch_nums == ["EARLIEST", "MIDDLE", "LATER"]

    # Test pagination
    res_page = client.get("/api/batches?skip=1&limit=1")
    assert res_page.status_code == 200
    page_data = res_page.json()
    assert page_data["total"] == 3
    assert len(page_data["items"]) == 1
    assert page_data["items"][0]["batch_number"] == "MIDDLE"


def test_list_batches_filtering_by_medicine_search_and_expiry(client, sample_medicine, second_medicine):
    """Test filtering by medicine_id, search keyword, expired boolean, and near-expiry horizon."""
    today = date.today()

    # Batch 1: sample_medicine, active, expires in 20 days
    client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "FILTER-AMX-20",
        "expiry_date": (today + timedelta(days=20)).isoformat(),
        "quantity_received": 10,
        "purchase_price": "10.00",
        "mrp": "15.00",
    })
    # Batch 2: sample_medicine, expired 10 days ago
    client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "FILTER-AMX-EXPIRED",
        "expiry_date": (today - timedelta(days=10)).isoformat(),
        "quantity_received": 10,
        "purchase_price": "10.00",
        "mrp": "15.00",
    })
    # Batch 3: second_medicine, active, expires in 120 days
    client.post("/api/batches", json={
        "medicine_id": second_medicine.id,
        "batch_number": "FILTER-DOLO-120",
        "expiry_date": (today + timedelta(days=120)).isoformat(),
        "quantity_received": 10,
        "purchase_price": "10.00",
        "mrp": "15.00",
    })

    # 1. Filter by medicine_id
    res_med = client.get(f"/api/batches?medicine_id={sample_medicine.id}")
    assert res_med.status_code == 200
    assert res_med.json()["total"] == 2

    # 2. Search by medicine name or batch number
    res_search = client.get("/api/batches?search=Dolo")
    assert res_search.status_code == 200
    assert res_search.json()["total"] == 1
    assert res_search.json()["items"][0]["batch_number"] == "FILTER-DOLO-120"

    # 3. Filter only expired
    res_exp = client.get("/api/batches?expired=true")
    assert res_exp.status_code == 200
    assert res_exp.json()["total"] == 1
    assert res_exp.json()["items"][0]["batch_number"] == "FILTER-AMX-EXPIRED"

    # 4. Filter only non-expired
    res_active = client.get("/api/batches?expired=false")
    assert res_active.status_code == 200
    assert res_active.json()["total"] == 2

    # 5. Filter expiring within 30 days
    res_30 = client.get("/api/batches?expiring_days=30")
    assert res_30.status_code == 200
    assert res_30.json()["total"] == 1
    assert res_30.json()["items"][0]["batch_number"] == "FILTER-AMX-20"


# ==============================================================================
# 4. PATCH Metadata & Stock Immutability Tests
# ==============================================================================

def test_patch_batch_metadata_preserves_stock_and_partials(client, sample_medicine):
    """
    Verify PATCH updates permitted metadata while preventing arbitrary stock changes.
    """
    exp = date.today() + timedelta(days=150)
    created = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "PATCH-TEST",
        "expiry_date": exp.isoformat(),
        "quantity_received": 100,
        "purchase_price": "20.00",
        "mrp": "30.00",
        "supplier_name": "Old Supplier",
        "storage_location": "Old Shelf",
    }).json()

    # Update metadata
    patch_res = client.patch(f"/api/batches/{created['id']}", json={
        "supplier_name": "New Supplier Ltd",
        "storage_location": "Cold Chain Rack B",
        "mrp": "35.00",
    })
    assert patch_res.status_code == 200
    updated = patch_res.json()

    assert updated["supplier_name"] == "New Supplier Ltd"
    assert updated["storage_location"] == "Cold Chain Rack B"
    assert updated["mrp"] == "35.00"
    # Unchanged fields
    assert updated["purchase_price"] == "20.00"
    assert updated["quantity_received"] == 100
    assert updated["current_stock"] == 100


def test_patch_batch_forbids_arbitrary_stock_tampering(client, sample_medicine):
    """
    Verify that attempting to change quantity_received or current_stock via PATCH
    is strictly rejected with HTTP 422 Unprocessable Entity.
    """
    exp = date.today() + timedelta(days=150)
    created = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "STOCK-PROTECT",
        "expiry_date": exp.isoformat(),
        "quantity_received": 50,
        "purchase_price": "10.00",
        "mrp": "15.00",
    }).json()

    # Attempt to tamper with current_stock
    res_stock = client.patch(f"/api/batches/{created['id']}", json={
        "current_stock": 9999,
    })
    assert res_stock.status_code == 422

    # Attempt to tamper with quantity_received
    res_qty = client.patch(f"/api/batches/{created['id']}", json={
        "quantity_received": 9999,
    })
    assert res_qty.status_code == 422


def test_patch_batch_rejects_explicit_null_on_non_nullable_fields(client, sample_medicine):
    """Verify that explicit null values for expiry_date, purchase_price, or mrp return 422."""
    exp = date.today() + timedelta(days=150)
    created = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "NULL-CHECK",
        "expiry_date": exp.isoformat(),
        "quantity_received": 50,
        "purchase_price": "10.00",
        "mrp": "15.00",
    }).json()

    for field in ["expiry_date", "purchase_price", "mrp"]:
        res = client.patch(f"/api/batches/{created['id']}", json={field: None})
        assert res.status_code == 422, f"Expected 422 for {field}=null, got {res.status_code}"

    # Clearing optional fields (supplier_name, storage_location) is allowed
    res_clear = client.patch(f"/api/batches/{created['id']}", json={
        "supplier_name": None,
        "storage_location": None,
    })
    assert res_clear.status_code == 200
    assert res_clear.json()["supplier_name"] is None
    assert res_clear.json()["storage_location"] is None


def test_patch_batch_invalid_date_ordering(client, sample_medicine):
    """Verify 422 when updating expiry_date to precede manufacturing_date."""
    today = date.today()
    created = client.post("/api/batches", json={
        "medicine_id": sample_medicine.id,
        "batch_number": "DATE-ORDER-PATCH",
        "manufacturing_date": today.isoformat(),
        "expiry_date": (today + timedelta(days=365)).isoformat(),
        "quantity_received": 50,
        "purchase_price": "10.00",
        "mrp": "15.00",
    }).json()

    # Attempt to move expiry date before mfg date
    res = client.patch(f"/api/batches/{created['id']}", json={
        "expiry_date": (today - timedelta(days=1)).isoformat(),
    })
    assert res.status_code == 422
    assert "Expiry date cannot be earlier than manufacturing date" in res.json()["detail"]


def test_patch_nonexistent_batch_returns_404(client):
    """Verify 404 when attempting to PATCH a nonexistent batch ID."""
    res = client.patch("/api/batches/77777", json={"supplier_name": "None"})
    assert res.status_code == 404
    assert "Batch with id 77777 not found" in res.json()["detail"]


# ==============================================================================
# 5. Database-Level Constraint & Integrity Tests
# ==============================================================================

def test_database_level_canonical_batch_key_uniqueness(db_session, sample_medicine):
    """
    Verify that the database engine enforces unique canonical_batch_key constraint
    at the SQL level even if application-level checks were bypassed.
    """
    today = date.today()
    b1 = Batch(
        medicine_id=sample_medicine.id,
        batch_number="SQL-DIRECT-01",
        expiry_date=today + timedelta(days=100),
        quantity_received=10,
        current_stock=10,
        purchase_price=Decimal("10.00"),
        mrp=Decimal("15.00"),
    )
    db_session.add(b1)
    db_session.commit()

    # Attempt duplicate insert directly on DB session
    b2 = Batch(
        medicine_id=sample_medicine.id,
        batch_number="sql-direct-01",  # Same canonical key
        expiry_date=today + timedelta(days=120),
        quantity_received=20,
        current_stock=20,
        purchase_price=Decimal("12.00"),
        mrp=Decimal("18.00"),
    )
    db_session.add(b2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
