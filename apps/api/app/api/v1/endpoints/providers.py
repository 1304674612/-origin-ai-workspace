from uuid import UUID

from fastapi import APIRouter
from openai import AsyncOpenAI
from starlette import status

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.crypto import decrypt_secret, encrypt_secret
from app.core.exceptions import OriginError
from app.repositories.provider_repository import ProviderRepository
from app.schemas.provider import (
    ModelInfo,
    ProviderCreate,
    ProviderRead,
    ProviderStatus,
    ProviderTestResult,
    ProviderUpdate,
)

router = APIRouter()

_STATIC_MODELS: list[ModelInfo] = [
    ModelInfo(id="gpt-4o-mini", name="GPT-4o mini", provider="openai", context_window=128000),
    ModelInfo(id="gpt-4.1-mini", name="GPT-4.1 mini", provider="openai", context_window=1000000),
    ModelInfo(id="deepseek-chat", name="DeepSeek Chat", provider="deepseek", context_window=64000),
    ModelInfo(id="qwen-plus", name="Qwen Plus", provider="qwen", context_window=131072),
    ModelInfo(id="claude-3-5-sonnet", name="Claude 3.5 Sonnet", provider="anthropic", context_window=200000),
    ModelInfo(id="llama3.1-70b", name="Llama 3.1 70B", provider="ollama", context_window=128000),
    ModelInfo(id="custom", name="OpenAI Compatible", provider="compatible", context_window=128000),
]


def _provider_configured(provider: str) -> bool:
    settings = get_settings()
    mapping = {
        "openai": settings.openai_api_key,
        "deepseek": settings.deepseek_api_key,
        "qwen": settings.qwen_api_key,
        "compatible": settings.openai_compatible_base_url,
        "anthropic": None,
        "ollama": None,
    }
    return bool(mapping.get(provider))


@router.get("/models", response_model=list[ModelInfo])
async def list_models() -> list[ModelInfo]:
    return [
        model for model in _STATIC_MODELS
        if _provider_configured(model.provider)
    ]


@router.get("/status", response_model=list[ProviderStatus])
async def provider_status() -> list[ProviderStatus]:
    settings = get_settings()
    return [
        ProviderStatus(
            provider="openai",
            configured=bool(settings.openai_api_key),
            default_model=settings.default_model,
        ),
        ProviderStatus(
            provider="deepseek",
            configured=bool(settings.deepseek_api_key),
            default_model="deepseek-chat",
        ),
        ProviderStatus(
            provider="qwen",
            configured=bool(settings.qwen_api_key),
            default_model="qwen-plus",
        ),
        ProviderStatus(
            provider="compatible",
            configured=bool(settings.openai_compatible_base_url),
            default_model="custom",
        ),
    ]


@router.get("", response_model=list[ProviderRead])
async def list_providers(session: DbSession, current_user: CurrentUser) -> list[ProviderRead]:
    providers = await ProviderRepository(session).list(current_user.id)
    return [ProviderRead.model_validate(item) for item in providers]


@router.post("", response_model=ProviderRead, status_code=status.HTTP_201_CREATED)
async def create_provider(
    payload: ProviderCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> ProviderRead:
    repo = ProviderRepository(session)
    if await repo.get_by_name(current_user.id, payload.name):
        raise OriginError("Provider name already exists", status.HTTP_409_CONFLICT)
    provider = await repo.create(
        user_id=current_user.id,
        name=payload.name,
        provider=payload.provider,
        api_key_encrypted=encrypt_secret(payload.api_key),
        base_url=payload.base_url,
        default_model=payload.default_model,
        is_enabled=payload.is_enabled,
        settings=payload.settings,
    )
    await session.commit()
    await session.refresh(provider)
    return ProviderRead.model_validate(provider)


@router.patch("/{provider_id}", response_model=ProviderRead)
async def update_provider(
    provider_id: UUID,
    payload: ProviderUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> ProviderRead:
    repo = ProviderRepository(session)
    provider = await repo.get(provider_id, current_user.id)
    if provider is None:
        raise OriginError("Provider not found", status.HTTP_404_NOT_FOUND)
    updates = payload.model_dump(exclude_unset=True)
    if "api_key" in updates:
        updates["api_key_encrypted"] = encrypt_secret(updates.pop("api_key"))
    if "name" in updates and updates["name"] != provider.name:
        existing = await repo.get_by_name(current_user.id, updates["name"])
        if existing is not None and existing.id != provider.id:
            raise OriginError("Provider name already exists", status.HTTP_409_CONFLICT)
    await repo.update(provider, **updates)
    await session.commit()
    await session.refresh(provider)
    return ProviderRead.model_validate(provider)


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> None:
    repo = ProviderRepository(session)
    provider = await repo.get(provider_id, current_user.id)
    if provider is None:
        raise OriginError("Provider not found", status.HTTP_404_NOT_FOUND)
    await repo.delete(provider)
    await session.commit()


@router.post("/{provider_id}/test", response_model=ProviderTestResult)
async def test_provider(
    provider_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> ProviderTestResult:
    repo = ProviderRepository(session)
    provider = await repo.get(provider_id, current_user.id)
    if provider is None:
        raise OriginError("Provider not found", status.HTTP_404_NOT_FOUND)

    api_key = decrypt_secret(provider.api_key_encrypted)
    if not api_key:
        raise OriginError("Provider API key is missing", status.HTTP_400_BAD_REQUEST)

    client = AsyncOpenAI(api_key=api_key, base_url=provider.base_url)
    try:
        models_response = await client.models.list()
        model_list = [
            ModelInfo(
                id=item.id,
                name=item.id,
                provider=provider.provider,
                context_window=128000,
                supports_streaming=True,
            )
            for item in models_response.data[:10]
        ]
        return ProviderTestResult(
            ok=True,
            message="Connection successful",
            models=model_list,
        )
    except Exception as exc:
        raise OriginError(
            "Provider test failed: could not connect to the provider API. Check your API key, base URL, and network connectivity.",
            status.HTTP_400_BAD_REQUEST,
        ) from exc
