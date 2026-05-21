from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.provider import AIProviderConfig


class ProviderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self, user_id: UUID) -> list[AIProviderConfig]:
        result = await self.session.execute(
            select(AIProviderConfig)
            .where(AIProviderConfig.user_id == user_id)
            .order_by(AIProviderConfig.is_enabled.desc(), AIProviderConfig.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, provider_id: UUID, user_id: UUID) -> AIProviderConfig | None:
        result = await self.session.execute(
            select(AIProviderConfig).where(
                AIProviderConfig.id == provider_id,
                AIProviderConfig.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_enabled_by_provider(
        self, user_id: UUID, provider: str
    ) -> AIProviderConfig | None:
        result = await self.session.execute(
            select(AIProviderConfig)
            .where(
                AIProviderConfig.user_id == user_id,
                AIProviderConfig.provider == provider,
                AIProviderConfig.is_enabled.is_(True),
            )
            .order_by(AIProviderConfig.updated_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, user_id: UUID, name: str) -> AIProviderConfig | None:
        result = await self.session.execute(
            select(AIProviderConfig).where(
                AIProviderConfig.user_id == user_id,
                AIProviderConfig.name == name,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: UUID,
        name: str,
        provider: str,
        api_key_encrypted: str | None,
        base_url: str | None,
        default_model: str | None,
        is_enabled: bool,
        settings: dict,
    ) -> AIProviderConfig:
        config = AIProviderConfig(
            user_id=user_id,
            name=name,
            provider=provider,
            api_key_encrypted=api_key_encrypted,
            base_url=base_url,
            default_model=default_model,
            is_enabled=is_enabled,
            settings=settings,
        )
        self.session.add(config)
        await self.session.flush()
        return config

    async def update(
        self,
        config: AIProviderConfig,
        *,
        name: str | None = None,
        provider: str | None = None,
        api_key_encrypted: str | None = None,
        base_url: str | None = None,
        default_model: str | None = None,
        is_enabled: bool | None = None,
        settings: dict | None = None,
    ) -> AIProviderConfig:
        if name is not None:
            config.name = name
        if provider is not None:
            config.provider = provider
        if api_key_encrypted is not None:
            config.api_key_encrypted = api_key_encrypted
        if base_url is not None:
            config.base_url = base_url
        if default_model is not None:
            config.default_model = default_model
        if is_enabled is not None:
            config.is_enabled = is_enabled
        if settings is not None:
            config.settings = settings
        await self.session.flush()
        return config

    async def delete(self, config: AIProviderConfig) -> None:
        await self.session.delete(config)
