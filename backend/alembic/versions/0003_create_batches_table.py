"""Create batches table for batch and expiry management

Revision ID: 0003_create_batches
Revises: 0002_add_canonical_key
Create Date: 2026-10-28 01:17:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '0003_create_batches'
down_revision: Union[str, None] = '0002_add_canonical_key'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if "batches" not in existing_tables:
        op.create_table(
            "batches",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("medicine_id", sa.Integer(), nullable=False),
            sa.Column("batch_number", sa.String(length=100), nullable=False),
            sa.Column("canonical_batch_key", sa.String(length=255), nullable=False),
            sa.Column("manufacturing_date", sa.Date(), nullable=True),
            sa.Column("expiry_date", sa.Date(), nullable=False),
            sa.Column("received_date", sa.Date(), nullable=False),
            sa.Column("quantity_received", sa.Integer(), nullable=False),
            sa.Column("current_stock", sa.Integer(), nullable=False),
            sa.Column("purchase_price", sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column("mrp", sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column("supplier_name", sa.String(length=255), nullable=True),
            sa.Column("storage_location", sa.String(length=100), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.CheckConstraint("quantity_received >= 0", name="chk_batches_quantity_received_non_negative"),
            sa.CheckConstraint("current_stock >= 0", name="chk_batches_current_stock_non_negative"),
            sa.CheckConstraint("purchase_price >= 0", name="chk_batches_purchase_price_non_negative"),
            sa.CheckConstraint("mrp >= 0", name="chk_batches_mrp_non_negative"),
            sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"], ondelete="RESTRICT"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_batches_id"), "batches", ["id"], unique=False)
        op.create_index(op.f("ix_batches_medicine_id"), "batches", ["medicine_id"], unique=False)
        op.create_index(op.f("ix_batches_batch_number"), "batches", ["batch_number"], unique=False)
        op.create_index(op.f("ix_batches_canonical_batch_key"), "batches", ["canonical_batch_key"], unique=True)
        op.create_index(op.f("ix_batches_expiry_date"), "batches", ["expiry_date"], unique=False)
        op.create_index("ix_batches_medicine_batch", "batches", ["medicine_id", "batch_number"], unique=False)


def downgrade() -> None:
    op.drop_table("batches")
