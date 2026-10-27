import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.medicine import Medicine


# Isolated in-memory SQLite database for test execution
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


# ==============================================================================
# Medicine Master Tests
# ==============================================================================

def test_create_valid_medicine(client):
    """Test creating a valid medicine record with all fields populated."""
    payload = {
        "medicine_name": "Paracetamol 650mg",
        "brand_name": "Dolo 650",
        "generic_name": "Paracetamol",
        "category": "Analgesics",
        "unit": "strip",
        "reorder_level": 25,
        "is_active": True,
    }
    response = client.post("/api/medicines", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["id"] is not None
    assert data["medicine_name"] == "Paracetamol 650mg"
    assert data["brand_name"] == "Dolo 650"
    assert data["generic_name"] == "Paracetamol"
    assert data["category"] == "Analgesics"
    assert data["unit"] == "strip"
    assert data["reorder_level"] == 25
    assert data["is_active"] is True
    assert "created_at" in data
    assert "updated_at" in data


def test_reject_invalid_or_missing_required_fields(client):
    """Test validation errors on missing or invalid required fields."""
    # 1. Missing medicine_name
    res1 = client.post("/api/medicines", json={"unit": "strip"})
    assert res1.status_code == 422

    # 2. Whitespace-only medicine_name
    res2 = client.post("/api/medicines", json={"medicine_name": "   ", "unit": "strip"})
    assert res2.status_code == 422

    # 3. Negative reorder_level
    res3 = client.post(
        "/api/medicines",
        json={"medicine_name": "Ibuprofen 400mg", "unit": "strip", "reorder_level": -5},
    )
    assert res3.status_code == 422


def test_handle_duplicate_records(client):
    """
    Test duplicate handling:
    - Same (medicine_name, brand_name) combination is rejected with 409 Conflict.
    - Different brands sharing the same generic salt are allowed.
    """
    payload_1 = {
        "medicine_name": "Amoxicillin 500mg",
        "brand_name": "Mox 500",
        "generic_name": "Amoxicillin Trihydrate",
        "unit": "strip",
        "reorder_level": 15,
    }
    res1 = client.post("/api/medicines", json=payload_1)
    assert res1.status_code == 201

    # Exact duplicate submission -> 409 Conflict
    res_dup = client.post("/api/medicines", json=payload_1)
    assert res_dup.status_code == 409
    assert "already exists in catalog" in res_dup.json()["detail"]

    # Different brand with same generic salt -> 201 Created (allowed)
    payload_diff_brand = {
        "medicine_name": "Amoxicillin 500mg",
        "brand_name": "Novamox 500",
        "generic_name": "Amoxicillin Trihydrate",
        "unit": "strip",
        "reorder_level": 20,
    }
    res_diff = client.post("/api/medicines", json=payload_diff_brand)
    assert res_diff.status_code == 201
    assert res_diff.json()["brand_name"] == "Novamox 500"


def test_list_and_search_medicines(client):
    """Test pagination, category filter, and multi-field search across catalog."""
    # Seed medicines
    meds = [
        {"medicine_name": "Paracetamol 650mg", "brand_name": "Dolo 650", "category": "Analgesics", "unit": "strip"},
        {"medicine_name": "Azithromycin 500mg", "brand_name": "Azee 500", "generic_name": "Azithromycin", "category": "Antibiotics", "unit": "strip"},
        {"medicine_name": "Cetirizine 10mg", "brand_name": "Cetzine", "category": "Antihistamines", "unit": "strip"},
    ]
    for m in meds:
        client.post("/api/medicines", json=m)

    # 1. Total list
    res = client.get("/api/medicines")
    assert res.status_code == 200
    assert res.json()["total"] == 3
    assert len(res.json()["items"]) == 3

    # 2. Search by brand name
    res_search_brand = client.get("/api/medicines?search=Dolo")
    assert res_search_brand.status_code == 200
    assert res_search_brand.json()["total"] == 1
    assert res_search_brand.json()["items"][0]["medicine_name"] == "Paracetamol 650mg"

    # 3. Search by generic salt
    res_search_gen = client.get("/api/medicines?search=Azithromycin")
    assert res_search_gen.status_code == 200
    assert res_search_gen.json()["total"] == 1
    assert res_search_gen.json()["items"][0]["brand_name"] == "Azee 500"

    # 4. Filter by category
    res_cat = client.get("/api/medicines?category=Antibiotics")
    assert res_cat.status_code == 200
    assert res_cat.json()["total"] == 1
    assert res_cat.json()["items"][0]["category"] == "Antibiotics"

    # 5. Pagination
    res_page = client.get("/api/medicines?skip=1&limit=1")
    assert res_page.status_code == 200
    assert res_page.json()["total"] == 3
    assert len(res_page.json()["items"]) == 1
    assert res_page.json()["skip"] == 1
    assert res_page.json()["limit"] == 1


def test_get_medicine_by_id(client):
    """Test retrieving a medicine by ID and 404 on missing record."""
    created = client.post(
        "/api/medicines",
        json={"medicine_name": "Pantoprazole 40mg", "brand_name": "Pan 40", "unit": "strip"},
    ).json()

    med_id = created["id"]
    res = client.get(f"/api/medicines/{med_id}")
    assert res.status_code == 200
    assert res.json()["medicine_name"] == "Pantoprazole 40mg"

    # Missing ID
    res_missing = client.get("/api/medicines/99999")
    assert res_missing.status_code == 404
    assert "not found" in res_missing.json()["detail"].lower()


def test_update_medicine(client):
    """Test partial updates (PATCH) on medicine fields and conflict detection."""
    created1 = client.post(
        "/api/medicines",
        json={"medicine_name": "Telmisartan 40mg", "brand_name": "Telma 40", "unit": "strip", "reorder_level": 10},
    ).json()
    med_id = created1["id"]

    # 1. Successful partial update
    patch_res = client.patch(
        f"/api/medicines/{med_id}",
        json={"reorder_level": 40, "generic_name": "Telmisartan IP"},
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["reorder_level"] == 40
    assert data["generic_name"] == "Telmisartan IP"
    assert data["brand_name"] == "Telma 40"

    # 2. Conflict on updating to another existing medicine
    created2 = client.post(
        "/api/medicines",
        json={"medicine_name": "Amlodipine 5mg", "brand_name": "Amlong 5", "unit": "strip"},
    ).json()

    conflict_res = client.patch(
        f"/api/medicines/{med_id}",
        json={"medicine_name": "Amlodipine 5mg", "brand_name": "Amlong 5"},
    )
    assert conflict_res.status_code == 409
    assert "already exists" in conflict_res.json()["detail"]

    # 3. Missing ID
    res_404 = client.patch("/api/medicines/99999", json={"reorder_level": 10})
    assert res_404.status_code == 404


def test_deactivate_medicine(client):
    """Test soft-deactivation (DELETE) setting is_active=False preserving records."""
    created = client.post(
        "/api/medicines",
        json={"medicine_name": "Metformin 500mg", "brand_name": "Glycomet 500", "unit": "strip", "is_active": True},
    ).json()
    med_id = created["id"]

    # Deactivate
    del_res = client.delete(f"/api/medicines/{med_id}")
    assert del_res.status_code == 200
    assert del_res.json()["is_active"] is False

    # Confirm record still exists (not permanently deleted)
    get_res = client.get(f"/api/medicines/{med_id}")
    assert get_res.status_code == 200
    assert get_res.json()["is_active"] is False

    # Filter inactive medicines
    list_res = client.get("/api/medicines?is_active=false")
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1
    assert list_res.json()["items"][0]["id"] == med_id

    # 404 on deleting non-existent ID
    missing_res = client.delete("/api/medicines/99999")
    assert missing_res.status_code == 404


def test_records_persist_across_sessions():
    """Confirm records persist across independent database sessions."""
    # Session 1: Create record
    session1 = TestingSessionLocal()
    new_med = Medicine(
        medicine_name="Montelukast 10mg",
        brand_name="Montair 10",
        unit="strip",
        reorder_level=15,
        is_active=True,
    )
    session1.add(new_med)
    session1.commit()
    med_id = new_med.id
    session1.close()

    # Session 2: Read record in brand-new session
    session2 = TestingSessionLocal()
    fetched = session2.get(Medicine, med_id)
    assert fetched is not None
    assert fetched.id == med_id
    assert fetched.medicine_name == "Montelukast 10mg"
    assert fetched.brand_name == "Montair 10"
    session2.close()
