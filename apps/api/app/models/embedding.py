from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import JSONVariant, UUIDVariant

if TYPE_CHECKING:
    from app.models.rag import DocumentChunk


class EmbeddingRecord(Base):
    __tablename__ = "embeddings"

    id: Mapped[UUID] = mapped_column(UUIDVariant, primary_key=True, default=uuid4)
    chunk_id: Mapped[UUID] = mapped_column(
        UUIDVariant, ForeignKey("document_chunks.id", ondelete="CASCADE"), index=True
    )
    provider: Mapped[str] = mapped_column(String(80), index=True)
    model: Mapped[str] = mapped_column(String(120), index=True)
    vector_dimensions: Mapped[int] = mapped_column(Integer)
    vector_data: Mapped[list[float]] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=list
    )
    embedding_metadata: Mapped[dict] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=dict
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chunk: Mapped["DocumentChunk"] = relationship(back_populates="embeddings")

