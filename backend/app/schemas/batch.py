from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class BatchBase(BaseModel):
    """Shared properties for Batch entities."""
    medicine_id: int = Field(..., gt=0, description="ID of the associated medicine record")
    batch_number: str = Field(..., min_length=1, max_length=100, description="Manufacturer batch identifier")
    manufacturing_date: Optional[date] = Field(None, description="Date the batch was manufactured")
    expiry_date: date = Field(..., description="Expiration date of the batch")
    purchase_price: Decimal = Field(..., ge=Decimal("0.00"), description="Purchase / cost price per unit")
    mrp: Decimal = Field(..., ge=Decimal("0.00"), description="Maximum Retail Price (selling ceiling) per unit")
    received_date: Optional[date] = Field(None, description="Date inventory was received into pharmacy")
    supplier_name: Optional[str] = Field(None, max_length=255, description="Distributor or supplier name")
    storage_location: Optional[str] = Field(None, max_length=100, description="Pharmacy rack, shelf, or cold chain bin")

    @field_validator("batch_number", mode="before")
    @classmethod
    def validate_batch_number(cls, v: Any) -> str:
        if v is None or not str(v).strip():
            raise ValueError("Batch number cannot be empty or blank.")
        return str(v).strip()

    @field_validator("supplier_name", "storage_location", mode="before")
    @classmethod
    def clean_optional_strings(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        stripped = str(v).strip()
        return stripped if stripped else None

    @model_validator(mode="after")
    def validate_date_ordering(self) -> "BatchBase":
        if self.manufacturing_date and self.expiry_date:
            if self.expiry_date < self.manufacturing_date:
                raise ValueError("Expiry date cannot be earlier than manufacturing date.")
        if self.received_date is None:
            self.received_date = date.today()
        return self


class BatchCreate(BatchBase):
    """Payload for registering a new incoming inventory batch."""
    quantity_received: int = Field(..., ge=0, description="Initial quantity received in this shipment")


class BatchUpdate(BaseModel):
    """
    Payload for updating permitted batch metadata.
    Arbitrary changes to quantity_received and current_stock are forbidden;
    inventory adjustments will be handled by the ledger transaction system.
    """
    model_config = ConfigDict(extra="forbid")

    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    purchase_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    mrp: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    supplier_name: Optional[str] = Field(None, max_length=255)
    storage_location: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="before")
    @classmethod
    def prevent_null_on_non_nullable_fields(cls, data: Any) -> Any:
        """
        Reject explicit null values for non-nullable columns while allowing
        legitimate partial updates (omitted fields) and permitting null on optional fields.
        """
        if not isinstance(data, dict):
            return data

        non_nullable_fields = {
            "expiry_date": "Expiry date cannot be null.",
            "purchase_price": "Purchase price cannot be null.",
            "mrp": "MRP cannot be null.",
        }

        errors = []
        for field_name, err_msg in non_nullable_fields.items():
            if field_name in data and data[field_name] is None:
                errors.append(err_msg)

        if errors:
            raise ValueError("; ".join(errors))

        return data

    @field_validator("supplier_name", "storage_location", mode="before")
    @classmethod
    def clean_optional_strings(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        stripped = str(v).strip()
        return stripped if stripped else None


class BatchResponse(BaseModel):
    """Read schema for a pharmacy inventory batch with computed expiry analytics."""
    id: int
    medicine_id: int
    medicine_name: Optional[str] = None
    brand_name: Optional[str] = None
    batch_number: str
    manufacturing_date: Optional[date] = None
    expiry_date: date
    received_date: date
    quantity_received: int
    current_stock: int
    purchase_price: Decimal
    mrp: Decimal
    supplier_name: Optional[str] = None
    storage_location: Optional[str] = None
    days_until_expiry: int
    is_expired: bool
    expiry_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_batch(cls, batch: Any, reference_date: Optional[date] = None) -> "BatchResponse":
        ref = reference_date or date.today()
        days = (batch.expiry_date - ref).days
        is_exp = days < 0
        if is_exp:
            status = "expired"
        elif days <= 90:
            status = "near_expiry"
        else:
            status = "normal"

        med_name = batch.medicine.medicine_name if getattr(batch, "medicine", None) else None
        b_name = batch.medicine.brand_name if getattr(batch, "medicine", None) else None

        return cls(
            id=batch.id,
            medicine_id=batch.medicine_id,
            medicine_name=med_name,
            brand_name=b_name,
            batch_number=batch.batch_number,
            manufacturing_date=batch.manufacturing_date,
            expiry_date=batch.expiry_date,
            received_date=batch.received_date,
            quantity_received=batch.quantity_received,
            current_stock=batch.current_stock,
            purchase_price=batch.purchase_price,
            mrp=batch.mrp,
            supplier_name=batch.supplier_name,
            storage_location=batch.storage_location,
            days_until_expiry=days,
            is_expired=is_exp,
            expiry_status=status,
            created_at=batch.created_at,
            updated_at=batch.updated_at,
        )


class BatchListResponse(BaseModel):
    """Paginated list envelope for Batch records."""
    items: List[BatchResponse]
    total: int
    skip: int
    limit: int
