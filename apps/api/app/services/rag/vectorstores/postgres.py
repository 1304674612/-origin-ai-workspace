from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.knowledge_repository import KnowledgeRepository
from app.services.rag.vectorstores.base import RetrievalResult, VectorRecord, VectorStore


class PostgresVectorStore(VectorStore):
    name = "postgres"

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = KnowledgeRepository(session)

    async def upsert(self, index_name: str, records: list[VectorRecord]) -> None:
        for record in records:
            await self.repository.add_embedding(
                chunk_id=UUID(str(record.metadata["chunk_id"])),
                provider=record.metadata.get("provider", "local"),
                model=record.metadata.get("model", "hash-embedding"),
                vector=record.vector,
                metadata={**record.metadata, "index_name": index_name},
            )

    async def search(
        self,
        index_name: str,
        query_vector: list[float],
        knowledge_base_id: UUID | None = None,
        limit: int = 8,
    ) -> list[RetrievalResult]:
        return await self.repository.search_chunks_by_index(
            index_name=index_name,
            query_vector=query_vector,
            knowledge_base_id=knowledge_base_id,
            limit=limit,
        )
