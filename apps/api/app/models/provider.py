from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import JSONVariant, UUIDVariant

if TYPE_CHECKING:
    from app.models.user import User


class AIProviderConfig(Base):
    __tablename__ = "ai_provider_configs"

    id: Mapped[UUID] = mapped_column(UUIDVariant, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        UUIDVariant, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(80))
    provider: Mapped[str] = mapped_column(String(80), index=True)
    base_url: Mapped[str | None] = mapped_column(String(500), default=None)
    api_key_encrypted: Mapped[str | None] = mapped_column(String(1000), default=None)
    default_model: Mapped[str | None] = mapped_column(String(120), default=None)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    settings: Mapped[dict] = mapped_column(
        JSONVariant().with_variant(JSONB, "postgresql"), default=dict
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="provider_configs")
