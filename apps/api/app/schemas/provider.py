from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    context_window: int
    supports_streaming: bool = True


class ProviderStatus(BaseModel):
    provider: str
    configured: bool
    default_model: str | None = None
    latency_ms: int | None = None


class ProviderCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    provider: str = Field(min_length=2, max_length=80)
    api_key: str | None = Field(default=None, min_length=1, max_length=4000)
    base_url: str | None = Field(default=None, max_length=500)
    default_model: str | None = Field(default=None, max_length=120)
    is_enabled: bool = True
    settings: dict = Field(default_factory=dict)


class ProviderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    provider: str | None = Field(default=None, min_length=2, max_length=80)
    api_key: str | None = Field(default=None, min_length=1, max_length=4000)
    base_url: str | None = Field(default=None, max_length=500)
    default_model: str | None = Field(default=None, max_length=120)
    is_enabled: bool | None = None
    settings: dict | None = None


class ProviderRead(ORMModel):
    id: UUID
    name: str
    provider: str
    base_url: str | None
    default_model: str | None
    is_enabled: bool
    settings: dict
    is_default: bool = False
    created_at: datetime
    updated_at: datetime


class ProviderTestResult(BaseModel):
    ok: bool
    message: str
    latency_ms: int | None = None
    models: list[ModelInfo] = Field(default_factory=list)
