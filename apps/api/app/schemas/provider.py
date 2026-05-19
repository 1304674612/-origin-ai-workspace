from pydantic import BaseModel


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
