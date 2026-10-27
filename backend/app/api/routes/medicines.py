from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.medicine import Medicine
from app.schemas.medicine import (
    MedicineCreate,
    MedicineListResponse,
    MedicineResponse,
    MedicineUpdate,
)

router = APIRouter(prefix="/medicines", tags=["Medicine Master"])


@router.post(
    "",
    response_model=MedicineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Medicine Master record",
    description="Adds a new formulation to the master catalog with packaging unit and reorder threshold.",
)
def create_medicine(
    medicine_in: MedicineCreate,
    db: Session = Depends(get_db),
) -> Medicine:
    """
    Register a new medicine in the catalog.
    Validates duplicate entries by (medicine_name, brand_name) without conflating
    distinct brands sharing identical generic salts.
    Provides database-level protection against race conditions.
    """
    clean_name = medicine_in.medicine_name.strip()
    clean_brand = medicine_in.brand_name.strip() if medicine_in.brand_name else None

    # Check for duplicate formulation under same brand
    dup_query = select(Medicine).where(
        func.lower(Medicine.medicine_name) == clean_name.lower()
    )
    if clean_brand:
        dup_query = dup_query.where(func.lower(Medicine.brand_name) == clean_brand.lower())
    else:
        dup_query = dup_query.where(Medicine.brand_name.is_(None))

    existing = db.execute(dup_query).scalars().first()
    if existing:
        brand_label = f" under brand '{clean_brand}'" if clean_brand else ""
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Medicine '{clean_name}'{brand_label} already exists in catalog (ID: {existing.id}).",
        )

    # Instantiate model with validated fields
    medicine_data = medicine_in.model_dump()
    new_medicine = Medicine(**medicine_data)

    try:
        db.add(new_medicine)
        db.commit()
        db.refresh(new_medicine)
    except IntegrityError:
        db.rollback()
        brand_label = f" under brand '{clean_brand}'" if clean_brand else ""
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Medicine '{clean_name}'{brand_label} already exists in catalog.",
        )

    return new_medicine


@router.get(
    "",
    response_model=MedicineListResponse,
    status_code=status.HTTP_200_OK,
    summary="List and search medicines",
    description="Retrieves a paginated list of catalog medicines with optional search across name, brand, generic, and category.",
)
def list_medicines(
    search: Optional[str] = Query(
        None,
        min_length=1,
        description="Search term matching medicine name, brand, generic salt, or category",
    ),
    category: Optional[str] = Query(
        None,
        description="Filter by exact therapeutic category",
    ),
    is_active: Optional[bool] = Query(
        None,
        description="Filter by active status (default: returns both active and deactivated)",
    ),
    skip: int = Query(
        0,
        ge=0,
        description="Pagination offset (number of records to skip)",
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Page limit (max items per page, 1-100)",
    ),
    db: Session = Depends(get_db),
) -> MedicineListResponse:
    """List medicines with multi-attribute filtering and pagination."""
    query = select(Medicine)

    # Active status filter
    if is_active is not None:
        query = query.where(Medicine.is_active == is_active)

    # Category filter
    if category:
        query = query.where(func.lower(Medicine.category) == category.strip().lower())

    # Multi-field search
    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Medicine.medicine_name).like(search_pattern),
                func.lower(Medicine.brand_name).like(search_pattern),
                func.lower(Medicine.generic_name).like(search_pattern),
                func.lower(Medicine.category).like(search_pattern),
            )
        )

    # Count total matching records
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    # Paginate and order alphabetically by medicine_name
    query = query.order_by(Medicine.medicine_name.asc()).offset(skip).limit(limit)
    items = db.execute(query).scalars().all()

    return MedicineListResponse(
        items=list(items),
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{medicine_id}",
    response_model=MedicineResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a medicine by ID",
    description="Fetches full details of a single medicine master record.",
)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
) -> Medicine:
    """Retrieve a single medicine record by its integer primary key."""
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {medicine_id} not found in catalog.",
        )
    return medicine


@router.patch(
    "/{medicine_id}",
    response_model=MedicineResponse,
    status_code=status.HTTP_200_OK,
    summary="Update editable medicine fields",
    description="Partially updates an existing medicine. Validates duplicate naming conflicts.",
)
def update_medicine(
    medicine_id: int,
    medicine_in: MedicineUpdate,
    db: Session = Depends(get_db),
) -> Medicine:
    """Partially update an existing medicine record."""
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {medicine_id} not found in catalog.",
        )

    update_dict = medicine_in.model_dump(exclude_unset=True)
    if not update_dict:
        return medicine

    # If updating medicine_name or brand_name, ensure it does not conflict with another record
    target_name = update_dict.get("medicine_name", medicine.medicine_name).strip()
    target_brand = (
        update_dict.get("brand_name", medicine.brand_name).strip()
        if update_dict.get("brand_name", medicine.brand_name)
        else None
    )

    conflict_query = select(Medicine).where(
        func.lower(Medicine.medicine_name) == target_name.lower(),
        Medicine.id != medicine_id,
    )
    if target_brand:
        conflict_query = conflict_query.where(func.lower(Medicine.brand_name) == target_brand.lower())
    else:
        conflict_query = conflict_query.where(Medicine.brand_name.is_(None))

    conflict = db.execute(conflict_query).scalars().first()
    if conflict:
        brand_label = f" under brand '{target_brand}'" if target_brand else ""
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Another medicine '{target_name}'{brand_label} already exists (ID: {conflict.id}).",
        )

    # Apply updates
    for field, val in update_dict.items():
        setattr(medicine, field, val)

    try:
        db.commit()
        db.refresh(medicine)
    except IntegrityError:
        db.rollback()
        brand_label = f" under brand '{target_brand}'" if target_brand else ""
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Another medicine '{target_name}'{brand_label} already exists in catalog.",
        )

    return medicine


@router.delete(
    "/{medicine_id}",
    response_model=MedicineResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate a medicine",
    description="Soft-deactivates a medicine (sets is_active=False) preserving audit and transaction history.",
)
def deactivate_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
) -> Medicine:
    """Soft deactivates a medicine to protect historical ledger and transaction integrity."""
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {medicine_id} not found in catalog.",
        )

    medicine.is_active = False
    db.commit()
    db.refresh(medicine)

    return medicine
