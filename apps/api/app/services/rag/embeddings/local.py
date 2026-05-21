"""
DEVELOPMENT FALLBACK ONLY — NOT FOR PRODUCTION USE.

This provider uses SHA-256 hashing with normalization to produce deterministic
but NON-SEMANTIC embedding vectors. It does NOT capture textual meaning or
enable true semantic similarity search.

For production RAG, use a real embedding provider:
  - OpenAI embeddings (openai.py)
  - BGE / sentence-transformers
  - Jina embeddings API
  - Ollama embeddings
"""

from __future__ import annotations

import hashlib
import math

from app.services.rag.embeddings.base import EmbeddingProvider


class LocalHashEmbeddingProvider(EmbeddingProvider):
    """Development-only fallback. Produces deterministic but non-semantic vectors."""

    name = "local"
    model_name = "hash-embedding"
    dimensions = 256

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    async def embed_query(self, text: str) -> list[float]:
        return self._embed(text)

    def _embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = [token for token in text.lower().split() if token.strip()]
        if not tokens:
            return vector
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            weight = 1.0 + (int.from_bytes(digest[4:8], "big") % 100) / 100.0
            vector[index] += weight
        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return vector
        return [value / norm for value in vector]
