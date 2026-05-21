from app.core.config import get_settings
from app.services.rag.embeddings.base import EmbeddingProvider
from app.services.rag.embeddings.local import LocalHashEmbeddingProvider
from app.services.rag.embeddings.openai import OpenAIEmbeddingProvider


def build_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    if settings.openai_api_key:
        return OpenAIEmbeddingProvider(api_key=settings.openai_api_key)
    return LocalHashEmbeddingProvider()
