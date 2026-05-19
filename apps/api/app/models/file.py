from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import JSONVariant, UUIDVariant

if TYPE_CHECKING:
    from app.models.rag import KnowledgeDocument
    from app.models.user import User


class FileStatus(StrEnum):
    uploaded = "uploaded"
    parsing = "parsing"
    parsed = "parsed"
    failed = "failed"


class FileAsset(Base):
    __tablename__ = "file_assets"

    id: Mapped[UUID] = mapped_column(UUIDVariant, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        UUIDVariant, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    filename: Mapped[str] = mapped_column(String(260))
    content_type: Mapped[str | None] = mapped_column(String(120), default=None)
    storage_path: Mapped[str] = mapped_column(String(700))
    size_bytes: Mapped[int] = mapped_column(Integer)
    status: Mapped[FileStatus] = mapped_column(
        Enum(FileStatus), default=FileStatus.uploaded, index=True
    )
    extracted_text: Mapped[str | None] = mapped_column(Text, default=None)
    file_metadata: Mapped[dict] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=dict
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="files")
    document: Mapped["KnowledgeDocument | None"] = relationship(
        back_populates="file", cascade="all, delete-orphan"
    )
