"""Sprints 2 a 5: ícono del plato e índices del panel y la cartilla.

Revision ID: 0003
"""

from pathlib import Path

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

SQL = Path(__file__).resolve().parent.parent / "sql" / "0003_operacion.sql"


def upgrade() -> None:
    op.execute(SQL.read_text(encoding="utf-8"))


def downgrade() -> None:
    op.execute("DROP INDEX ix_cartilla_estudiante")
    op.execute("DROP INDEX ix_orden_proveedor_fecha")
    op.execute("ALTER TABLE plato DROP COLUMN emoji")
