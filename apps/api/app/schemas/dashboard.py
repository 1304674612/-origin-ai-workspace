from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.provider import ProviderStatus


class UsagePoint(BaseModel):
    label: str
    tokens: int
    latency_ms: int


class DashboardStats(BaseModel):
    total_conversations: int
    total_messages: int
    total_files: int
    indexed_documents: int
    token_usage_total: int
    provider_status: list[ProviderStatus]
    usage_series: list[UsagePoint]


class ServiceStatus(BaseModel):
    name: str
    status: Literal["ok", "degraded", "down"]


class SummaryItem(BaseModel):
    id: UUID
    title: str
    created_at: datetime | None = None


class DashboardSummary(BaseModel):
    conversations_count: int
    files_count: int
    blogs_count: int
    system_status: Literal["ok", "degraded", "down"]
    recent_conversations: list[SummaryItem]
    recent_files: list[SummaryItem]
    recent_blogs: list[SummaryItem]
    services: list[ServiceStatus]
