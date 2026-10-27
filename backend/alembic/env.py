from logging.config import fileConfig
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, pool
from alembic import context

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.core.database import Base
import app.models  # ensure models are registered with Base.metadata

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """Retrieve database URL from settings if default placeholder is detected."""
    url = config.get_main_option("sqlalchemy.url")
    if not url or "driver://user:pass@localhost/dbname" in url:
        return settings.sqlalchemy_database_uri
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Check if a connection was passed programmatically (e.g. during tests or init_db)
    provided_connection = config.attributes.get("connection", None)

    if provided_connection is not None:
        context.configure(
            connection=provided_connection,
            target_metadata=target_metadata,
            render_as_batch=True if provided_connection.dialect.name == "sqlite" else False,
        )
        with context.begin_transaction():
            context.run_migrations()
    else:
        connectable = create_engine(
            get_url(),
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                render_as_batch=True if connection.dialect.name == "sqlite" else False,
            )

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
