from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db, sanitize_error
from app.models.batch import Batch
from app.models.medicine import Medicine
from app.schemas.batch import (
    BatchCreate,
    BatchListResponse,
    BatchResponse,
    BatchUpdate,
)

router = APIRouter(prefix="/batches", tags=["Batch & Expiry Management"])


@router.post(
    "",
    response_model=BatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new inventory batch",
    description="Registers an incoming stock batch with unit economics and expiry dates. Initializes current_stock.",
)
def create_batch(
    payload: BatchCreate,
    db: Session = Depends(get_db),
) -> BatchResponse:
    # 1. Verify associated medicine exists
    medicine = db.get(Medicine, payload.medicine_id)
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with id {payload.medicine_id} does not exist.",
        )

    # 2. Check for duplicate batch number under the same medicine (case-insensitive)
    clean_batch_num = payload.batch_number.strip()
    target_key = Batch.compute_canonical_key(payload.medicine_id, clean_batch_num)
    existing_batch = db.query(Batch).filter(Batch.canonical_batch_key == target_key).first()
    if existing_batch:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch '{clean_batch_num}' already exists for medicine '{medicine.medicine_name}' (ID {payload.medicine_id}).",
        )

    # 3. Create Batch instance
    batch = Batch(
        medicine_id=payload.medicine_id,
        batch_number=clean_batch_num,
        manufacturing_date=payload.manufacturing_date,
        expiry_date=payload.expiry_date,
        received_date=payload.received_date or date.today(),
        quantity_received=payload.quantity_received,
        current_stock=payload.quantity_received,
        purchase_price=payload.purchase_price,
        mrp=payload.mrp,
        supplier_name=payload.supplier_name,
        storage_location=payload.storage_location,
    )

    try:
        db.add(batch)
        db.commit()
        db.refresh(batch)
    except IntegrityError as exc:
        db.rollback()
        sanitized = sanitize_error(str(exc.orig if hasattr(exc, "orig") and exc.orig else exc))
        if "foreign key" in sanitized.lower() or "chk_batches" in sanitized.lower():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Database constraint violation: {sanitized}",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch '{clean_batch_num}' already exists for medicine ID {payload.medicine_id}.",
        )

    # Attach medicine for response serialization
    batch.medicine = medicine
    return BatchResponse.from_orm_batch(batch)


@router.get(
    "",
    response_model=BatchListResponse,
    summary="List inventory batches with filtering and pagination",
    description="Retrieve batches with FEFO ordering (earliest expiry first), pagination, and search filters.",
)
def list_batches(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
    medicine_id: Optional[int] = Query(None, description="Filter batches by specific medicine ID"),
    search: Optional[str] = Query(None, description="Search across batch number or medicine name"),
    expired: Optional[bool] = Query(None, description="Filter: true=only expired, false=only active batches"),
    expiring_days: Optional[int] = Query(None, ge=0, description="Filter batches expiring within N days from today"),
    db: Session = Depends(get_db),
) -> BatchListResponse:
    today = date.today()
    query = db.query(Batch).join(Medicine).options(joinedload(Batch.medicine))

    # Medicine filter
    if medicine_id is not None:
        query = query.filter(Batch.medicine_id == medicine_id)

    # Search filter (batch number, medicine name, or brand name)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Batch.batch_number.ilike(term),
                Medicine.medicine_name.ilike(term),
                Medicine.brand_name.ilike(term),
            )
        )

    # Expired boolean filter
    if expired is True:
        query = query.filter(Batch.expiry_date < today)
    elif expired is False:
        query = query.filter(Batch.expiry_date >= today)

    # Expiring within N days filter (near-expiry horizon)
    if expiring_days is not None:
        horizon_date = today + timedelta(days=expiring_days)
        query = query.filter(
            Batch.expiry_date >= today,
            Batch.expiry_date <= horizon_date,
        )

    # Count matching records
    total = query.count()

    # Sort FEFO: Earliest expiry date first, then ID
    batches = query.order_by(Batch.expiry_date.asc(), Batch.id.asc()).offset(skip).limit(limit).all()

    items = [BatchResponse.from_orm_batch(b, reference_date=today) for b in batches]

    return BatchListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{batch_id}",
    response_model=BatchResponse,
    summary="Retrieve batch details by ID",
    description="Returns detailed batch information with calculated shelf-life analytics.",
)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
) -> BatchResponse:
    batch = db.query(Batch).options(joinedload(Batch.medicine)).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with id {batch_id} not found.",
        )
    return BatchResponse.from_orm_batch(batch)


@router.patch(
    "/{batch_id}",
    response_model=BatchResponse,
    summary="Update permitted batch metadata",
    description="Update non-stock metadata (pricing, supplier, rack location, dates). Quantity adjustments are restricted.",
)
def update_batch(
    batch_id: int,
    payload: BatchUpdate,
    db: Session = Depends(get_db),
) -> BatchResponse:
    batch = db.query(Batch).options(joinedload(Batch.medicine)).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with id {batch_id} not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return BatchResponse.from_orm_batch(batch)

    # Validate date ordering if either date is changing
    new_expiry = update_data.get("expiry_date", batch.expiry_date)
    new_mfg = update_data["manufacturing_date"] if "manufacturing_date" in update_data else batch.manufacturing_date
    if new_mfg and new_expiry and new_expiry < new_mfg:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Expiry date cannot be earlier than manufacturing date.",
        )

    for field, value in update_data.items():
        setattr(batch, field, value)

    try:
        db.commit()
        db.refresh(batch)
    except IntegrityError as exc:
        db.rollback()
        sanitized = sanitize_error(str(exc.orig if hasattr(exc, "orig") and exc.orig else exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Database constraint violation: {sanitized}",
        )

    return BatchResponse.from_orm_batch(batch)
