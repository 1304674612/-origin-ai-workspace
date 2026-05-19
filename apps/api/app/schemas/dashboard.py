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
    token_usage_today: int
    provider_status: list[ProviderStatus]
    usage_series: list[UsagePoint]
