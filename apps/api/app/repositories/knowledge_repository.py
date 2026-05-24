from uuid import UUID

import json
from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.tokens import count_tokens
from app.models.embedding import EmbeddingRecord
from app.models.knowledge_base import KnowledgeBase
from app.models.rag import DocumentChunk, KnowledgeDocument
from app.services.rag.vectorstores.base import RetrievalResult


class KnowledgeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_bases(
        self, user_id: UUID, offset: int = 0, limit: int = 50
    ) -> tuple[list[KnowledgeBase], int]:
        base = select(KnowledgeBase).where(
            KnowledgeBase.user_id == user_id, KnowledgeBase.is_archived.is_(False)
        )
        total_result = await self.session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(total_result.scalar_one())
        result = await self.session.execute(
            base.order_by(KnowledgeBase.is_pinned.desc(), KnowledgeBase.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_base(self, kb_id: UUID, user_id: UUID) -> KnowledgeBase | None:
        result = await self.session.execute(
            select(KnowledgeBase).where(
                KnowledgeBase.id == kb_id,
                KnowledgeBase.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_base(
        self,
        kb: KnowledgeBase,
        *,
        name: str | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        is_archived: bool | None = None,
        is_pinned: bool | None = None,
        is_favorite: bool | None = None,
        kb_metadata: dict | None = None,
    ) -> KnowledgeBase:
        if name is not None:
            kb.name = name
        if description is not None:
            kb.description = description
        if tags is not None:
            kb.tags = tags
        if is_archived is not None:
            kb.is_archived = is_archived
        if is_pinned is not None:
            kb.is_pinned = is_pinned
        if is_favorite is not None:
            kb.is_favorite = is_favorite
        if kb_metadata is not None:
            kb.kb_metadata = kb_metadata
        await self.session.flush()
        return kb

    async def delete_base(self, kb: KnowledgeBase) -> None:
        await self.session.delete(kb)

    async def create_base(
        self,
        *,
        user_id: UUID,
        name: str,
        description: str | None,
        tags: list[str],
    ) -> KnowledgeBase:
        kb = KnowledgeBase(user_id=user_id, name=name, description=description, tags=tags)
        self.session.add(kb)
        await self.session.flush()
        return kb

    async def list_documents(
        self, user_id: UUID, kb_id: UUID | None = None, source_type: str | None = None,
        offset: int = 0, limit: int = 50
    ) -> tuple[list[KnowledgeDocument], int]:
        base = (
            select(KnowledgeDocument)
            .where(KnowledgeDocument.user_id == user_id)
        )
        if kb_id is not None:
            base = base.where(KnowledgeDocument.knowledge_base_id == kb_id)
        if source_type is not None:
            base = base.where(KnowledgeDocument.source_type == source_type)
        total_result = await self.session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(total_result.scalar_one())
        result = await self.session.execute(
            base.options(selectinload(KnowledgeDocument.chunks))
            .order_by(KnowledgeDocument.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def create_document(
        self,
        *,
        user_id: UUID,
        title: str,
        file_id: UUID | None,
        knowledge_base_id: UUID | None,
        source_type: str = "file",
        index_name: str = "default",
        embedding_model: str | None = None,
        metadata: dict | None = None,
    ) -> KnowledgeDocument:
        document = KnowledgeDocument(
            user_id=user_id,
            knowledge_base_id=knowledge_base_id,
            title=title,
            file_id=file_id,
            source_type=source_type,
            index_name=index_name,
            embedding_model=embedding_model,
            document_metadata=metadata or {},
        )
        self.session.add(document)
        await self.session.flush()
        return document

    async def set_document_knowledge_base(
        self, document: KnowledgeDocument, knowledge_base_id: UUID | None
    ) -> KnowledgeDocument:
        document.knowledge_base_id = knowledge_base_id
        await self.session.flush()
        return document

    async def get_document(self, document_id: UUID, user_id: UUID) -> KnowledgeDocument | None:
        result = await self.session.execute(
            select(KnowledgeDocument)
            .options(selectinload(KnowledgeDocument.chunks).selectinload(DocumentChunk.embeddings))
            .where(KnowledgeDocument.id == document_id, KnowledgeDocument.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def add_chunk(
        self,
        *,
        document_id: UUID,
        chunk_index: int,
        content: str,
        metadata: dict,
    ) -> DocumentChunk:
        chunk = DocumentChunk(
            document_id=document_id,
            chunk_index=chunk_index,
            content=content,
            token_count=max(1, count_tokens(content)),
            chunk_metadata=metadata,
        )
        self.session.add(chunk)
        await self.session.flush()
        return chunk

    async def add_embedding(
        self,
        *,
        chunk_id: UUID,
        provider: str,
        model: str,
        vector: list[float],
        metadata: dict | None = None,
    ) -> EmbeddingRecord:
        record = EmbeddingRecord(
            chunk_id=chunk_id,
            provider=provider,
            model=model,
            vector_dimensions=len(vector),
            vector_data=vector,
            embedding_metadata=metadata or {},
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def get_embeddings_for_document(self, document_id: UUID) -> list[EmbeddingRecord]:
        result = await self.session.execute(
            select(EmbeddingRecord)
            .join(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
        )
        return list(result.scalars().all())

    async def delete_document(self, document: KnowledgeDocument) -> None:
        await self.session.delete(document)

    async def delete_chunks_for_document(self, document_id: UUID) -> None:
        await self.session.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))

    async def searchable_chunks(
        self, *, user_id: UUID, knowledge_base_id: UUID | None = None
    ) -> list[DocumentChunk]:
        statement = (
            select(DocumentChunk)
            .join(KnowledgeDocument)
            .options(selectinload(DocumentChunk.document))
            .where(KnowledgeDocument.user_id == user_id)
        )
        if knowledge_base_id is not None:
            statement = statement.where(KnowledgeDocument.knowledge_base_id == knowledge_base_id)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def search_chunks_by_index(
        self,
        *,
        index_name: str,
        query_vector: list[float],
        knowledge_base_id: UUID | None = None,
        limit: int = 8,
    ) -> list[RetrievalResult]:
        try:
            return await self._search_pgvector(index_name, query_vector, knowledge_base_id, limit)
        except Exception:
            return await self._search_fallback(index_name, query_vector, knowledge_base_id, limit)

    async def _search_pgvector(
        self,
        index_name: str,
        query_vector: list[float],
        knowledge_base_id: UUID | None,
        limit: int,
    ) -> list[RetrievalResult]:
        query = text("""
            WITH latest_embeddings AS (
                SELECT DISTINCT ON (chunk_id) chunk_id, vector_data
                FROM embeddings
                ORDER BY chunk_id, created_at DESC
            )
            SELECT dc.id, dc.content, dc.document_id, dc.chunk_metadata,
                   kd.title AS document_title,
                   1 - (le.vector_data <=> :query_vector::vector) AS similarity
            FROM document_chunks dc
            JOIN knowledge_documents kd ON dc.document_id = kd.id
            JOIN latest_embeddings le ON dc.id = le.chunk_id
            WHERE kd.index_name = :index_name
              AND (:kb_id IS NULL OR kd.knowledge_base_id = :kb_id)
            ORDER BY similarity DESC
            LIMIT :limit
        """)
        params = {
            "query_vector": json.dumps(query_vector),
            "index_name": index_name,
            "kb_id": str(knowledge_base_id) if knowledge_base_id else None,
            "limit": limit,
        }
        result = await self.session.execute(query, params)
        rows = result.fetchall()
        return [
            RetrievalResult(
                id=str(row.id),
                text=row.content,
                score=float(row.similarity),
                metadata={
                    "chunk_id": str(row.id),
                    "document_id": str(row.document_id),
                    "document_title": row.document_title,
                    "page_number": (row.chunk_metadata or {}).get("page_number"),
                    "source": (row.chunk_metadata or {}).get("source"),
                    "mime_type": (row.chunk_metadata or {}).get("mime_type"),
                    "file_name": (row.chunk_metadata or {}).get("file_name"),
                },
            )
            for row in rows
        ]

    async def _search_fallback(
        self,
        index_name: str,
        query_vector: list[float],
        knowledge_base_id: UUID | None,
        limit: int,
    ) -> list[RetrievalResult]:
        result = await self.session.execute(
            select(DocumentChunk)
            .options(
                selectinload(DocumentChunk.document),
                selectinload(DocumentChunk.embeddings),
            )
            .join(KnowledgeDocument)
            .where(KnowledgeDocument.index_name == index_name)
        )
        records = list(result.scalars().all())
        scored: list[RetrievalResult] = []
        for chunk in records:
            embedding = chunk.embeddings[-1] if chunk.embeddings else None
            if embedding is None or not embedding.vector_data:
                continue
            if knowledge_base_id is not None and chunk.document.knowledge_base_id != knowledge_base_id:
                continue
            score = _cosine_similarity(query_vector, embedding.vector_data)
            scored.append(
                RetrievalResult(
                    id=str(chunk.id),
                    text=chunk.content,
                    score=score,
                    metadata={
                        "chunk_id": str(chunk.id),
                        "document_id": str(chunk.document_id),
                        "document_title": chunk.document.title if chunk.document else None,
                        "page_number": chunk.chunk_metadata.get("page_number"),
                        "source": chunk.chunk_metadata.get("source"),
                        "mime_type": chunk.chunk_metadata.get("mime_type"),
                        "file_name": chunk.chunk_metadata.get("file_name"),
                    },
                )
            )
        scored.sort(key=lambda item: item.score, reverse=True)
        return scored[:limit]

    async def count_bases(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(KnowledgeBase).where(KnowledgeBase.user_id == user_id)
        )
        return int(result.scalar_one())

    async def count_chunks(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(DocumentChunk)
            .join(KnowledgeDocument)
            .where(KnowledgeDocument.user_id == user_id)
        )
        return int(result.scalar_one())

    async def count_documents_for_base(self, user_id: UUID, kb_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(KnowledgeDocument)
            .where(
                KnowledgeDocument.user_id == user_id,
                KnowledgeDocument.knowledge_base_id == kb_id,
            )
        )
        return int(result.scalar_one())


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    size = min(len(left), len(right))
    left = left[:size]
    right = right[:size]
    numerator = sum(lv * rv for lv, rv in zip(left, right, strict=False))
    left_norm = sum(lv * lv for lv in left) ** 0.5
    right_norm = sum(rv * rv for rv in right) ** 0.5
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return numerator / (left_norm * right_norm)
