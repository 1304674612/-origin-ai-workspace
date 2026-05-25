"""add missing indexes and unique constraints

Revision ID: 0007_missing_indexes
Revises: 0006_drop_vector_id
Create Date: 2026-05-25
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0007_missing_indexes"
down_revision: str | None = "0006_drop_vector_id"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # H4: composite index for pgvector DISTINCT ON (chunk_id) ORDER BY created_at DESC
    op.create_index(
        "ix_embeddings_chunk_id_created_at_desc",
        "embeddings",
        ["chunk_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )

    # M14: index on source_type for filtered document listing
    op.create_index("ix_knowledge_documents_source_type", "knowledge_documents", ["source_type"])

    # M15: unique constraint on (document_id, chunk_index) to prevent duplicate chunks
    op.create_unique_constraint(
        "uq_document_chunks_document_id_chunk_index",
        "document_chunks",
        ["document_id", "chunk_index"],
    )

    # M16: unique constraint on (user_id, name) for AI provider configs
    op.create_unique_constraint(
        "uq_ai_provider_configs_user_id_name",
        "ai_provider_configs",
        ["user_id", "name"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_ai_provider_configs_user_id_name", "ai_provider_configs", type_="unique")
    op.drop_constraint("uq_document_chunks_document_id_chunk_index", "document_chunks", type_="unique")
    op.drop_index("ix_knowledge_documents_source_type", table_name="knowledge_documents")
    op.drop_index("ix_embeddings_chunk_id_created_at_desc", table_name="embeddings")
