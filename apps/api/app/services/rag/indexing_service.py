from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import FileAsset
from app.models.user import User
from app.repositories.rag_repository import RagRepository
from app.services.rag.chunker import TextChunker
from app.services.rag.embeddings.base import EmbeddingProvider


class IndexingService:
    def __init__(
        self,
        session: AsyncSession,
        chunker: TextChunker,
        embedding_provider: EmbeddingProvider | None = None,
    ) -> None:
        self.session = session
        self.chunker = chunker
        self.repository = RagRepository(session)
        self.embedding_provider = embedding_provider

    async def index_file(
        self,
        user: User,
        file_asset: FileAsset,
        text: str,
        *,
        knowledge_base_id: UUID | None = None,
        metadata: dict | None = None,
    ) -> None:
        chunks = self.chunker.split(text)
        if not chunks:
            return
        document = await self.repository.create_document(
            user_id=user.id,
            title=file_asset.filename,
            file_id=file_asset.id,
            knowledge_base_id=knowledge_base_id,
            source_type="file",
            index_name="default",
            metadata={
                "file_asset_id": str(file_asset.id),
                **(metadata or {}),
            },
        )
        chunk_records = await self.repository.add_chunks(document.id, chunks)
        if self.embedding_provider is None:
            return
        vectors = await self.embedding_provider.embed_documents(chunks)
        for chunk, vector in zip(chunk_records, vectors, strict=False):
            await self.repository.add_embedding(
                chunk_id=chunk.id,
                provider=self.embedding_provider.name,
                model=self.embedding_provider.model_name,
                vector=vector,
                metadata={"knowledge_base_id": knowledge_base_id},
            )
