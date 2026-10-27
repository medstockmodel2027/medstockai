import os
from pathlib import Path
import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import StaticPool
from alembic.config import Config
from alembic import command


@pytest.fixture
def alembic_config_for_test(tmp_path):
    """
    Creates an Alembic Config pointing to an isolated SQLite file in a temp directory.
    """
    db_file = tmp_path / "migration_test.db"
    db_url = f"sqlite:///{db_file.as_posix()}"

    ini_path = Path(__file__).resolve().parent.parent / "alembic.ini"
    alembic_cfg = Config(str(ini_path))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    return alembic_cfg, db_url


def test_alembic_clean_upgrade_to_head(alembic_config_for_test):
    """Verify that a fresh database successfully upgrades to head revision."""
    cfg, db_url = alembic_config_for_test

    command.upgrade(cfg, "head")

    engine = create_engine(db_url)
    with engine.connect() as conn:
        inspector = inspect(conn)
        tables = inspector.get_table_names()
        assert "medicines" in tables
        assert "batches" in tables
        assert "alembic_version" in tables

        # Verify medicines columns
        med_cols = [c["name"] for c in inspector.get_columns("medicines")]
        assert "canonical_key" in med_cols

        # Verify batches columns
        batch_cols = [c["name"] for c in inspector.get_columns("batches")]
        assert "canonical_batch_key" in batch_cols
        assert "purchase_price" in batch_cols
        assert "mrp" in batch_cols
        assert "current_stock" in batch_cols


def test_alembic_upgrade_existing_database_with_backfill(alembic_config_for_test):
    """
    Simulate an existing development database created before canonical_key existed:
    1. Upgrade to 0001 (initial medicines table)
    2. Insert pre-existing records without canonical_key
    3. Upgrade to 0002 & 0003
    4. Confirm canonical_key is safely populated without deleting or losing records
    """
    cfg, db_url = alembic_config_for_test

    # 1. Step to 0001
    command.upgrade(cfg, "0001_create_medicines")

    engine = create_engine(db_url)
    with engine.connect() as conn:
        # 2. Insert records without canonical_key
        conn.execute(text(
            "INSERT INTO medicines (medicine_name, brand_name, unit, reorder_level, is_active) "
            "VALUES ('Cetirizine 10mg', 'Zyrtec', 'strip', 15, 1)"
        ))
        conn.execute(text(
            "INSERT INTO medicines (medicine_name, brand_name, unit, reorder_level, is_active) "
            "VALUES ('Ibuprofen 400mg', NULL, 'strip', 25, 1)"
        ))
        conn.commit()

    # 3. Upgrade to head (0002 and 0003)
    command.upgrade(cfg, "head")

    # 4. Verify canonical_key was backfilled properly
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, medicine_name, brand_name, canonical_key FROM medicines")).fetchall()
        assert len(rows) == 2
        
        # Cetirizine
        assert rows[0][1] == "Cetirizine 10mg"
        assert rows[0][3] == "cetirizine 10mg||zyrtec"

        # Ibuprofen (unbranded)
        assert rows[1][1] == "Ibuprofen 400mg"
        assert rows[1][3] == "ibuprofen 400mg||"


def test_alembic_migration_aborts_on_preexisting_duplicates(alembic_config_for_test):
    """
    Verify that if pre-existing duplicate records exist in a development database,
    migration 0002 stops safely with an informative RuntimeError rather than
    deleting or overwriting records.
    """
    cfg, db_url = alembic_config_for_test

    # Step to 0001
    command.upgrade(cfg, "0001_create_medicines")

    engine = create_engine(db_url)
    with engine.connect() as conn:
        # Insert two duplicate records
        conn.execute(text(
            "INSERT INTO medicines (medicine_name, brand_name, unit, reorder_level, is_active) "
            "VALUES ('Duplicate Med', 'BrandX', 'strip', 10, 1)"
        ))
        conn.execute(text(
            "INSERT INTO medicines (medicine_name, brand_name, unit, reorder_level, is_active) "
            "VALUES ('duplicate med', 'brandx', 'strip', 20, 1)"
        ))
        conn.commit()

    # Attempt upgrade to 0002 - must abort safely
    with pytest.raises(RuntimeError) as exc_info:
        command.upgrade(cfg, "0002_add_canonical_key")

    assert "Migration aborted to prevent data loss: Duplicate medicine records detected" in str(exc_info.value)

    # Verify both records are still intact (no deletions or data loss)
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id FROM medicines")).fetchall()
        assert len(rows) == 2
