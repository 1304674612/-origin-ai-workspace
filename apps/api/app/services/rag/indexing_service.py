from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import FileAsset
from app.models.user import User
from app.repositories.rag_repository import RagRepository
from app.services.rag.chunker import TextChunker


class IndexingService:
    def __init__(self, session: AsyncSession, chunker: TextChunker) -> None:
        self.session = session
        self.chunker = chunker
        self.repository = RagRepository(session)

    async def index_file(self, user: User, file_asset: FileAsset, text: str) -> None:
        chunks = self.chunker.split(text)
        if not chunks:
            return
        document = await self.repository.create_document(
            user_id=user.id,
            title=file_asset.filename,
            file_id=file_asset.id,
            source_type="file",
            index_name="default",
            metadata={"file_asset_id": str(file_asset.id)},
        )
        await self.repository.add_chunks(document.id, chunks)
