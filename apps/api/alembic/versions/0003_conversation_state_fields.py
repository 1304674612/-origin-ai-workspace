"""add conversation state fields

Revision ID: 0003_conversation_state
Revises: 0002_knowledge_base
Create Date: 2026-05-21
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_conversation_state"
down_revision: str | None = "0002_knowledge_base"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "conversations",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "conversations",
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("conversations", "is_favorite")
    op.drop_column("conversations", "is_pinned")
    op.drop_column("conversations", "is_archived")
