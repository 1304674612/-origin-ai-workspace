from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import JSONVariant, UUIDVariant

if TYPE_CHECKING:
    from app.models.chat import Conversation
    from app.models.rag import KnowledgeDocument
    from app.models.user import User


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id: Mapped[UUID] = mapped_column(UUIDVariant, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        UUIDVariant, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[list[str]] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=list
    )
    kb_metadata: Mapped[dict] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=dict
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="knowledge_bases")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="knowledge_base")
    documents: Mapped[list["KnowledgeDocument"]] = relationship(
        back_populates="knowledge_base", cascade="all, delete-orphan"
    )
