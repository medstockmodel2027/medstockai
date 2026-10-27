from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    String,
    event,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Medicine(Base):
    """
    SQLAlchemy model representing the Medicine Master catalog.
    Note: Calculated stock quantities are deliberately excluded from this master model;
    batch-level ledger movements and stock valuations will be implemented separately in Phase 2.
    """

    __tablename__ = "medicines"

    __table_args__ = (
        CheckConstraint("reorder_level >= 0", name="chk_medicines_reorder_level_non_negative"),
        Index("ix_medicines_name_brand", "medicine_name", "brand_name"),
    )

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)

    # Required Nomenclature
    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Optional Classification
    brand_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    generic_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    # Dispensing & Packaging Unit
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="strip")

    # Inventory Threshold
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    # Lifecycle Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    # Database-level unique constraint protecting against concurrent duplicate inserts,
    # including medicines without a brand name (format: lower(name) + "||" + lower(brand or ""))
    canonical_key: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        unique=True,
        index=True,
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    @staticmethod
    def compute_canonical_key(name: str, brand: Optional[str]) -> str:
        clean_name = (name or "").strip().lower()
        clean_brand = (brand or "").strip().lower()
        return f"{clean_name}||{clean_brand}"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not getattr(self, "canonical_key", None):
            self.canonical_key = self.compute_canonical_key(self.medicine_name, self.brand_name)

    def __repr__(self) -> str:
        return (
            f"<Medicine(id={self.id}, name='{self.medicine_name}', "
            f"brand='{self.brand_name}', active={self.is_active})>"
        )


@event.listens_for(Medicine, "before_insert")
def set_canonical_key_before_insert(mapper, connection, target: Medicine):
    target.canonical_key = Medicine.compute_canonical_key(target.medicine_name, target.brand_name)


@event.listens_for(Medicine, "before_update")
def set_canonical_key_before_update(mapper, connection, target: Medicine):
    target.canonical_key = Medicine.compute_canonical_key(target.medicine_name, target.brand_name)

