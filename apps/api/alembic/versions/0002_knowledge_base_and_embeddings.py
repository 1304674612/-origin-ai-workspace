"""knowledge base and embeddings

Revision ID: 0002_knowledge_base_and_embeddings
Revises: 0001_initial_schema
Create Date: 2026-05-21
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_knowledge_base"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── knowledge_bases ──────────────────────────────
    op.create_table(
        "knowledge_bases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("kb_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_knowledge_bases_user_id", "knowledge_bases", ["user_id"])
    op.create_index("ix_knowledge_bases_name", "knowledge_bases", ["name"])

    # ── embeddings ────────────────────────────────────
    op.create_table(
        "embeddings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=120), nullable=False),
        sa.Column("vector_dimensions", sa.Integer(), nullable=False),
        sa.Column("vector_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("embedding_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_embeddings_chunk_id", "embeddings", ["chunk_id"])
    op.create_index("ix_embeddings_provider", "embeddings", ["provider"])
    op.create_index("ix_embeddings_model", "embeddings", ["model"])

    # ── conversations.knowledge_base_id ───────────────
    op.add_column(
        "conversations",
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_bases.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_conversations_knowledge_base_id", "conversations", ["knowledge_base_id"])

    # ── knowledge_documents.knowledge_base_id ──────────
    op.add_column(
        "knowledge_documents",
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_bases.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_knowledge_documents_knowledge_base_id", "knowledge_documents", ["knowledge_base_id"])


def downgrade() -> None:
    op.drop_index("ix_knowledge_documents_knowledge_base_id", table_name="knowledge_documents")
    op.drop_column("knowledge_documents", "knowledge_base_id")

    op.drop_index("ix_conversations_knowledge_base_id", table_name="conversations")
    op.drop_column("conversations", "knowledge_base_id")

    op.drop_index("ix_embeddings_model", table_name="embeddings")
    op.drop_index("ix_embeddings_provider", table_name="embeddings")
    op.drop_index("ix_embeddings_chunk_id", table_name="embeddings")
    op.drop_table("embeddings")

    op.drop_index("ix_knowledge_bases_name", table_name="knowledge_bases")
    op.drop_index("ix_knowledge_bases_user_id", table_name="knowledge_bases")
    op.drop_table("knowledge_bases")
