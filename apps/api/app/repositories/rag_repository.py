from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag import DocumentChunk, KnowledgeDocument


class RagRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_document(
        self,
        *,
        user_id: UUID,
        title: str,
        file_id: UUID | None,
        source_type: str = "file",
        index_name: str = "default",
        embedding_model: str | None = None,
        metadata: dict | None = None,
    ) -> KnowledgeDocument:
        document = KnowledgeDocument(
            user_id=user_id,
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

    async def add_chunks(self, document_id: UUID, chunks: list[str]) -> list[DocumentChunk]:
        records = [
            DocumentChunk(
                document_id=document_id,
                chunk_index=index,
                content=content,
                token_count=max(1, len(content) // 4),
            )
            for index, content in enumerate(chunks)
        ]
        self.session.add_all(records)
        await self.session.flush()
        return records

    async def count_documents(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(KnowledgeDocument)
            .where(KnowledgeDocument.user_id == user_id)
        )
        return int(result.scalar_one())
