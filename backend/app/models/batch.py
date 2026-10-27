from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    event,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.medicine import Medicine


class Batch(Base):
    """
    SQLAlchemy model representing a specific pharmaceutical inventory batch.
    Includes unit economics (Numeric purchase price & MRP), expiry boundaries,
    and foreign-key constraints linking to the Medicine catalog.
    """

    __tablename__ = "batches"

    __table_args__ = (
        CheckConstraint("quantity_received >= 0", name="chk_batches_quantity_received_non_negative"),
        CheckConstraint("current_stock >= 0", name="chk_batches_current_stock_non_negative"),
        CheckConstraint("purchase_price >= 0", name="chk_batches_purchase_price_non_negative"),
        CheckConstraint("mrp >= 0", name="chk_batches_mrp_non_negative"),
        Index("ix_batches_medicine_batch", "medicine_id", "batch_number"),
    )

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)

    # Medicine Foreign Key
    medicine_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("medicines.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Batch Identifier
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Canonical Key for Case-Insensitive Duplicate Protection per Medicine
    # Format: "{medicine_id}||{clean_batch_number}"
    canonical_batch_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    # Expiry & Manufacturing Dates
    manufacturing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    received_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    # Quantity Tracking
    quantity_received: Mapped[int] = mapped_column(Integer, nullable=False)
    current_stock: Mapped[int] = mapped_column(Integer, nullable=False)

    # Financial / Pricing Economics (Numeric precision to avoid floating point inaccuracies)
    purchase_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    mrp: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Procurement & Storage Details
    supplier_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    storage_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

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

    # Relationship to Medicine
    medicine: Mapped["Medicine"] = relationship("Medicine", back_populates="batches")

    @staticmethod
    def compute_canonical_key(medicine_id: int, batch_number: str) -> str:
        clean_batch = (batch_number or "").strip().lower()
        return f"{medicine_id}||{clean_batch}"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not getattr(self, "canonical_batch_key", None) and self.medicine_id and self.batch_number:
            self.canonical_batch_key = self.compute_canonical_key(self.medicine_id, self.batch_number)
        if "current_stock" not in kwargs and "quantity_received" in kwargs:
            self.current_stock = kwargs["quantity_received"]

    def days_until_expiry(self, reference_date: Optional[date] = None) -> int:
        """Calculate days remaining until expiry from a given reference date (default: today)."""
        ref = reference_date or date.today()
        return (self.expiry_date - ref).days

    def is_expired(self, reference_date: Optional[date] = None) -> bool:
        """Return True if batch expiry date is strictly before the reference date."""
        return self.days_until_expiry(reference_date) < 0

    def calculate_expiry_status(self, reference_date: Optional[date] = None, near_expiry_threshold_days: int = 90) -> str:
        """
        Dynamically calculate pharmacy operational status:
        - 'expired': past expiry date (< 0 days)
        - 'near_expiry': expiring within near_expiry_threshold_days (0 to 90 days)
        - 'normal': healthy shelf life (> 90 days)
        """
        days = self.days_until_expiry(reference_date)
        if days < 0:
            return "expired"
        elif days <= near_expiry_threshold_days:
            return "near_expiry"
        return "normal"

    def __repr__(self) -> str:
        return (
            f"<Batch(id={self.id}, medicine_id={self.medicine_id}, "
            f"batch_number='{self.batch_number}', expiry={self.expiry_date}, stock={self.current_stock})>"
        )


@event.listens_for(Batch, "before_insert")
def set_canonical_batch_key_before_insert(mapper, connection, target: Batch):
    target.canonical_batch_key = Batch.compute_canonical_key(target.medicine_id, target.batch_number)
    if target.current_stock is None and target.quantity_received is not None:
        target.current_stock = target.quantity_received


@event.listens_for(Batch, "before_update")
def set_canonical_batch_key_before_update(mapper, connection, target: Batch):
    target.canonical_batch_key = Batch.compute_canonical_key(target.medicine_id, target.batch_number)
