"""Entorno de Alembic.

Las migraciones de Aliflow son SQL escrito a mano, no autogeneradas desde los
modelos: el esquema expresa reglas de negocio como restricciones (CHECK, FK
compuestas, triggers) que el autogenerador no sabe producir.
"""

from alembic import context
from sqlalchemy import create_engine

from aliflow.config import get_settings

url = context.config.attributes.get("database_url") or get_settings().database_url


def run_migrations_offline() -> None:
    context.configure(url=url, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection, transaction_per_migration=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
