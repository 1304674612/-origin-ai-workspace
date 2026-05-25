from __future__ import annotations

from functools import lru_cache

from openai import AsyncOpenAI

from app.core.exceptions import OriginError
from app.services.rag.embeddings.base import EmbeddingProvider


@lru_cache(maxsize=4)
def _get_embedding_client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key)


class OpenAIEmbeddingProvider(EmbeddingProvider):
    name = "openai"

    def __init__(self, *, api_key: str, model_name: str = "text-embedding-3-small") -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.dimensions = 1536

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key:
            raise OriginError("OpenAI embedding API key is not configured")
        client = _get_embedding_client(self.api_key)
        response = await client.embeddings.create(model=self.model_name, input=texts)
        return [item.embedding for item in response.data]

    async def embed_query(self, text: str) -> list[float]:
        vectors = await self.embed_documents([text])
        return vectors[0] if vectors else []
