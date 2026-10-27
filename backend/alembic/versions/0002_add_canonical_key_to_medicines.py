"""Add canonical_key column to medicines with duplicate detection

Revision ID: 0002_add_canonical_key
Revises: 0001_create_medicines
Create Date: 2026-10-28 01:16:00.000000

"""
from collections import defaultdict
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '0002_add_canonical_key'
down_revision: Union[str, None] = '0001_create_medicines'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = [col["name"] for col in inspector.get_columns("medicines")]

    if "canonical_key" not in existing_columns:
        # Step 1: Inspect existing records for duplicate canonical keys
        result = bind.execute(sa.text("SELECT id, medicine_name, brand_name FROM medicines")).fetchall()
        
        key_occurrences = defaultdict(list)
        for row in result:
            row_id = row[0]
            med_name = (row[1] or "").strip().lower()
            b_name = (row[2] or "").strip().lower()
            key = f"{med_name}||{b_name}"
            key_occurrences[key].append({"id": row_id, "medicine_name": row[1], "brand_name": row[2]})

        duplicates = {k: v for k, v in key_occurrences.items() if len(v) > 1}
        if duplicates:
            formatted_dupes = "; ".join([
                f"Key '{k}': {len(entries)} records (IDs: {[e['id'] for e in entries]})"
                for k, entries in duplicates.items()
            ])
            raise RuntimeError(
                f"Migration aborted to prevent data loss: Duplicate medicine records detected in database: {formatted_dupes}. "
                f"Please manually reconcile these duplicate records before applying this migration."
            )

        # Step 2: Add canonical_key as nullable column initially
        with op.batch_alter_table("medicines") as batch_op:
            batch_op.add_column(sa.Column("canonical_key", sa.String(length=512), nullable=True))

        # Step 3: Populate canonical_key for all existing records
        for row in result:
            row_id = row[0]
            med_name = (row[1] or "").strip().lower()
            b_name = (row[2] or "").strip().lower()
            key = f"{med_name}||{b_name}"
            bind.execute(
                sa.text("UPDATE medicines SET canonical_key = :k WHERE id = :id"),
                {"k": key, "id": row_id},
            )

        # Step 4: Alter column to NOT NULL and add unique index
        with op.batch_alter_table("medicines") as batch_op:
            batch_op.alter_column("canonical_key", nullable=False, existing_type=sa.String(length=512))
            batch_op.create_index("ix_medicines_canonical_key", ["canonical_key"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("medicines") as batch_op:
        batch_op.drop_index("ix_medicines_canonical_key")
        batch_op.drop_column("canonical_key")
