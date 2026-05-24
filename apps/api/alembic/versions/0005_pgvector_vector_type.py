"""migrate vector_data from JSONB to pgvector vector type

Revision ID: 0005_pgvector_vector
Revises: 0004_pgvector
Create Date: 2026-05-24
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0005_pgvector_vector"
down_revision: str | None = "0004_pgvector"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = "0004_pgvector"


def upgrade() -> None:
    op.execute("ALTER TABLE embeddings ALTER COLUMN vector_data DROP DEFAULT")
    op.execute("ALTER TABLE embeddings ALTER COLUMN vector_data TYPE vector USING vector_data::text::vector")


def downgrade() -> None:
    op.execute("ALTER TABLE embeddings ALTER COLUMN vector_data TYPE jsonb USING vector_data::text::jsonb")
    op.execute("ALTER TABLE embeddings ALTER COLUMN vector_data SET DEFAULT '[]'::jsonb")
