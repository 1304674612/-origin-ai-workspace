from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.provider import ModelInfo, ProviderStatus

router = APIRouter()


@router.get("/models", response_model=list[ModelInfo])
async def list_models() -> list[ModelInfo]:
    return [
        ModelInfo(id="gpt-4o-mini", name="GPT-4o mini", provider="openai", context_window=128000),
        ModelInfo(
            id="gpt-4.1-mini",
            name="GPT-4.1 mini",
            provider="openai",
            context_window=1000000,
        ),
        ModelInfo(
            id="deepseek-chat",
            name="DeepSeek Chat",
            provider="deepseek",
            context_window=64000,
        ),
        ModelInfo(id="qwen-plus", name="Qwen Plus", provider="qwen", context_window=131072),
        ModelInfo(
            id="custom",
            name="OpenAI Compatible",
            provider="compatible",
            context_window=128000,
        ),
    ]


@router.get("/status", response_model=list[ProviderStatus])
async def provider_status() -> list[ProviderStatus]:
    settings = get_settings()
    return [
        ProviderStatus(
            provider="openai",
            configured=bool(settings.openai_api_key),
            default_model=settings.default_model,
            latency_ms=142,
        ),
        ProviderStatus(
            provider="deepseek",
            configured=bool(settings.deepseek_api_key),
            default_model="deepseek-chat",
            latency_ms=188,
        ),
        ProviderStatus(
            provider="qwen",
            configured=bool(settings.qwen_api_key),
            default_model="qwen-plus",
            latency_ms=164,
        ),
        ProviderStatus(
            provider="compatible",
            configured=bool(settings.openai_compatible_base_url),
            default_model="custom",
            latency_ms=210,
        ),
    ]
