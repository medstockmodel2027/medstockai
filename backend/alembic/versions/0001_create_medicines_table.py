"""Create initial medicines table

Revision ID: 0001_create_medicines
Revises: 
Create Date: 2026-10-28 01:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '0001_create_medicines'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if "medicines" not in existing_tables:
        op.create_table(
            "medicines",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("medicine_name", sa.String(length=255), nullable=False),
            sa.Column("brand_name", sa.String(length=255), nullable=True),
            sa.Column("generic_name", sa.String(length=255), nullable=True),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("unit", sa.String(length=50), nullable=False, server_default="strip"),
            sa.Column("reorder_level", sa.Integer(), nullable=False, server_default="10"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.CheckConstraint("reorder_level >= 0", name="chk_medicines_reorder_level_non_negative"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_medicines_id"), "medicines", ["id"], unique=False)
        op.create_index(op.f("ix_medicines_medicine_name"), "medicines", ["medicine_name"], unique=False)
        op.create_index(op.f("ix_medicines_brand_name"), "medicines", ["brand_name"], unique=False)
        op.create_index(op.f("ix_medicines_generic_name"), "medicines", ["generic_name"], unique=False)
        op.create_index(op.f("ix_medicines_category"), "medicines", ["category"], unique=False)
        op.create_index(op.f("ix_medicines_is_active"), "medicines", ["is_active"], unique=False)
        op.create_index("ix_medicines_name_brand", "medicines", ["medicine_name", "brand_name"], unique=False)


def downgrade() -> None:
    op.drop_table("medicines")
