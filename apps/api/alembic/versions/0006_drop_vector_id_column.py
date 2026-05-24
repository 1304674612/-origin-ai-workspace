"""drop unused vector_id column from document_chunks

Revision ID: 0006_drop_vector_id
Revises: 0005_pgvector_vector
Create Date: 2026-05-24
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_drop_vector_id"
down_revision: str | None = "0005_pgvector_vector"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = "0004_pgvector"


def upgrade() -> None:
    op.drop_index("ix_document_chunks_vector_id", table_name="document_chunks")
    op.drop_column("document_chunks", "vector_id")


def downgrade() -> None:
    op.add_column("document_chunks", sa.Column("vector_id", sa.String(length=260), nullable=True))
    op.create_index("ix_document_chunks_vector_id", "document_chunks", ["vector_id"])
