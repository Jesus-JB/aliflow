"""Sprint 1: sesiones, código institucional opcional y antigüedad del stock.

Revision ID: 0002
"""

from pathlib import Path

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SQL = Path(__file__).resolve().parent.parent / "sql" / "0002_sprint1.sql"


def upgrade() -> None:
    op.execute(SQL.read_text(encoding="utf-8"))


def downgrade() -> None:
    op.execute("ALTER TABLE plato DROP COLUMN stock_sincronizado_en")
    op.execute("ALTER TABLE estudiante ALTER COLUMN codigo_institucional SET NOT NULL")
    op.execute("DROP TABLE sesion")
