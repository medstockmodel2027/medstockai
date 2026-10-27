from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class MedicineBase(BaseModel):
    """Shared attributes for Medicine Master records."""
    medicine_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Official name of the formulation (e.g. Paracetamol 650mg, Augmentin 625 Duo)",
    )
    brand_name: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Commercial brand trade name (e.g. Dolo 650, Calpol, Augmentin)",
    )
    generic_name: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Generic chemical salt or active pharmaceutical ingredient",
    )
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Therapeutic category (e.g. Analgesics, Antibiotics, Antipyretics)",
    )
    unit: str = Field(
        default="strip",
        min_length=1,
        max_length=50,
        description="Stock unit: strip, tablet, bottle, vial, box, sachet, tube, canister",
    )
    reorder_level: int = Field(
        default=10,
        ge=0,
        description="Minimum inventory unit threshold triggering reorder warnings (must be >= 0)",
    )
    is_active: bool = Field(
        default=True,
        description="Active status of the SKU (set to False upon soft deactivation)",
    )


class MedicineCreate(MedicineBase):
    """Schema for creating a new Medicine Master entry."""

    @field_validator("medicine_name", "unit", mode="before")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        if v is None:
            raise ValueError("Field cannot be null.")
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Field cannot be empty or only whitespace.")
            return trimmed
        return v

    @field_validator("brand_name", "generic_name", "category", mode="before")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            trimmed = v.strip()
            return trimmed if trimmed else None
        return v


class MedicineUpdate(BaseModel):
    """
    Schema for updating an existing Medicine Master entry (partial update).
    Preserves partial updates when fields are omitted, but strictly rejects explicit
    null values for non-nullable columns (medicine_name, unit, reorder_level, is_active).
    Optional fields (brand_name, generic_name, category) continue to allow null.
    """
    medicine_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    brand_name: Optional[str] = Field(default=None, max_length=255)
    generic_name: Optional[str] = Field(default=None, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    unit: Optional[str] = Field(default=None, min_length=1, max_length=50)
    reorder_level: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = Field(default=None)

    @model_validator(mode="before")
    @classmethod
    def reject_null_for_non_nullable_fields(cls, data):
        """Reject explicit nulls for database columns that must not be null."""
        if isinstance(data, dict):
            non_nullable_fields = {
                "medicine_name": "medicine_name cannot be null.",
                "unit": "unit cannot be null.",
                "reorder_level": "reorder_level cannot be null.",
                "is_active": "is_active cannot be null.",
            }
            for field, err_msg in non_nullable_fields.items():
                if field in data and data[field] is None:
                    raise ValueError(err_msg)
        return data

    @field_validator("medicine_name", "unit", mode="before")
    @classmethod
    def validate_update_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            raise ValueError("Field cannot be null.")
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Field cannot be empty or only whitespace.")
            return trimmed
        return v

    @field_validator("brand_name", "generic_name", "category", mode="before")
    @classmethod
    def clean_optional_update_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and isinstance(v, str):
            trimmed = v.strip()
            return trimmed if trimmed else None
        return v


class MedicineResponse(MedicineBase):
    """Full Medicine Master response schema."""
    id: int = Field(..., description="Unique database identifier")
    created_at: datetime = Field(..., description="Timestamp of creation (UTC)")
    updated_at: datetime = Field(..., description="Timestamp of last update (UTC)")

    model_config = ConfigDict(from_attributes=True)


class MedicineListResponse(BaseModel):
    """Paginated list of medicines."""
    items: List[MedicineResponse] = Field(..., description="List of medicines matching query")
    total: int = Field(..., description="Total number of records matching query")
    skip: int = Field(..., description="Number of skipped records")
    limit: int = Field(..., description="Page size limit applied")
