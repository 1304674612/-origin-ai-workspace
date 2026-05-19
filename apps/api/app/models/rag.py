from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import JSONVariant, UUIDVariant

if TYPE_CHECKING:
    from app.models.file import FileAsset


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id: Mapped[UUID] = mapped_column(UUIDVariant, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        UUIDVariant, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    file_id: Mapped[UUID | None] = mapped_column(
        UUIDVariant, ForeignKey("file_assets.id", ondelete="SET NULL"), default=None, index=True
    )
    title: Mapped[str] = mapped_column(String(260))
    source_type: Mapped[str] = mapped_column(String(80), default="file")
    index_name: Mapped[str] = mapped_column(String(120), default="default")
    embedding_model: Mapped[str | None] = mapped_column(String(120), default=None)
    document_metadata: Mapped[dict] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=dict
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    file: Mapped["FileAsset | None"] = relationship(back_populates="document")
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[UUID] = mapped_column(UUIDVariant, primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(
        UUIDVariant, ForeignKey("knowledge_documents.id", ondelete="CASCADE"), index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    vector_id: Mapped[str | None] = mapped_column(String(260), default=None, index=True)
    chunk_metadata: Mapped[dict] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=dict
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped[KnowledgeDocument] = relationship(back_populates="chunks")
