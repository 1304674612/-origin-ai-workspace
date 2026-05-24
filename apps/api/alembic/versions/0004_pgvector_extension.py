"""enable pgvector extension

Revision ID: 0004_pgvector
Revises: 0003_conversation_state
Create Date: 2026-05-24
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0004_pgvector"
down_revision: str | None = "0003_conversation_state"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS vector")
