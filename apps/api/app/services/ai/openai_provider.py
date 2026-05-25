from collections.abc import AsyncIterator
from functools import lru_cache

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.exceptions import OriginError
from app.services.ai.types import AIProvider, ChatCompletionRequest


@lru_cache(maxsize=8)
def _get_client(api_key: str, base_url: str | None = None) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url=base_url)


class OpenAICompatibleProvider(AIProvider):
    def __init__(
        self,
        *,
        name: str,
        api_key: str | None,
        base_url: str | None = None,
    ) -> None:
        self.name = name
        self.api_key = api_key
        self.base_url = base_url

    async def stream_chat(self, request: ChatCompletionRequest) -> AsyncIterator[str]:
        if not self.api_key:
            raise OriginError(f"{self.name} API key is not configured")

        client = _get_client(self.api_key, self.base_url)
        stream = await client.chat.completions.create(
            model=request.model,
            messages=[{"role": item.role, "content": item.content} for item in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta


def create_builtin_provider(provider: str) -> OpenAICompatibleProvider:
    settings = get_settings()
    provider_map = {
        "openai": {
            "api_key": settings.openai_api_key,
            "base_url": None,
        },
        "deepseek": {
            "api_key": settings.deepseek_api_key,
            "base_url": "https://api.deepseek.com",
        },
        "qwen": {
            "api_key": settings.qwen_api_key,
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        },
        "compatible": {
            "api_key": settings.openai_api_key,
            "base_url": settings.openai_compatible_base_url,
        },
    }
    if provider not in provider_map:
        raise OriginError(f"Unsupported provider: {provider}")
    config = provider_map[provider]
    return OpenAICompatibleProvider(name=provider, **config)
