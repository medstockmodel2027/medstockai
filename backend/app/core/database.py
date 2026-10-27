import logging
import re
from typing import Generator, Optional, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("medstock_ai.database")


class Base(DeclarativeBase):
    """Base class for SQLAlchemy declarative models in Phase 2."""
    pass


# MySQL Connection pool settings
# connect_timeout=3 ensures fast diagnostics when MySQL is unreachable
connect_args = {
    "connect_timeout": 3,
}

try:
    engine = create_engine(
        settings.sqlalchemy_database_uri,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,  # Recycle connections to prevent MySQL 8hr idle timeout
        connect_args=connect_args,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as exc:
    logger.error("Failed to initialize MySQL SQLAlchemy engine: %s", sanitize_error(str(exc)))
    engine = None
    SessionLocal = None


def sanitize_error(raw_message: str) -> str:
    """Strip passwords and sensitive connection parameters from MySQL error messages."""
    if not raw_message:
        return "Unknown database error."

    # Remove password from URIs like mysql+pymysql://user:pass@host:port/db
    sanitized = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", raw_message)
    # Mask password=xyz in connection strings
    sanitized = re.sub(r"password=['\"][^'\"]+['\"]", "password='***'", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"password=[^\s;,]+", "password=***", sanitized, flags=re.IGNORECASE)

    return sanitized


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency providing a transactional SQLAlchemy session.
    Ensures session is properly closed after each request.
    """
    if SessionLocal is None:
        raise RuntimeError("MySQL database engine is not initialized. Please verify backend/.env settings.")

    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, str, Optional[str]]:
    """
    Perform a live health probe against the local MySQL instance executing 'SELECT 1'.
    Returns:
        (is_connected: bool, summary_message: str, error_detail: Optional[str])

    Guarantees that database passwords or sensitive internal paths are never exposed.
    """
    if engine is None:
        return (
            False,
            "MySQL engine could not be initialized from configuration.",
            "Invalid database URI or missing driver configuration.",
        )

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return (
            True,
            "MySQL database connection is active and healthy.",
            None,
        )
    except SQLAlchemyError as exc:
        clean_detail = sanitize_error(str(exc.orig if hasattr(exc, "orig") and exc.orig else exc))
        logger.warning("MySQL connection probe failed: %s", clean_detail)
        return (
            False,
            "MySQL connection failed. Ensure MySQL service is running locally on port 3306 and credentials in .env are valid.",
            clean_detail,
        )
    except Exception as exc:
        clean_detail = sanitize_error(str(exc))
        logger.warning("Unexpected error during MySQL health check: %s", clean_detail)
        return (
            False,
            "Unexpected error occurred while attempting MySQL connection.",
            clean_detail,
        )


def run_migrations(connection=None, alembic_ini_path: Optional[str] = None) -> bool:
    """
    Run Alembic migrations programmatically to apply schema evolution up to 'head'.
    Ensures safe upgrades for existing and fresh databases.
    """
    from pathlib import Path
    try:
        from alembic.config import Config
        from alembic import command

        if alembic_ini_path is None:
            alembic_ini_path = str(Path(__file__).resolve().parent.parent.parent / "alembic.ini")

        alembic_cfg = Config(alembic_ini_path)
        if connection is not None:
            alembic_cfg.attributes["connection"] = connection
            command.upgrade(alembic_cfg, "head")
        elif engine is not None:
            with engine.connect() as conn:
                alembic_cfg.attributes["connection"] = conn
                command.upgrade(alembic_cfg, "head")
        else:
            return False

        logger.info("Alembic schema migrations executed successfully up to head.")
        return True
    except Exception as exc:
        logger.warning("Alembic migration execution note: %s", sanitize_error(str(exc)))
        return False


def init_db(engine_instance=None) -> bool:
    """
    Safely initialize or upgrade registered database tables.
    Attempts Alembic migrations first; falls back to idempotent Base.metadata.create_all().
    Never drops or resets existing tables or data.
    """
    eng = engine_instance or engine
    if eng is None:
        logger.warning("Cannot initialize tables: engine is None.")
        return False

    try:
        # Import models so they are registered with Base.metadata
        import app.models  # noqa: F401

        # Attempt Alembic migration path
        migrated = False
        try:
            with eng.connect() as conn:
                migrated = run_migrations(connection=conn)
        except Exception as mig_exc:
            logger.warning("Alembic upgrade bypass: %s", sanitize_error(str(mig_exc)))

        if not migrated:
            Base.metadata.create_all(bind=eng)
            logger.info("Database schema verified via Base.metadata.create_all().")

        return True
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", sanitize_error(str(exc)))
        return False

