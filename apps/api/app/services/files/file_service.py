from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import OriginError
from app.models.file import FileStatus
from app.models.user import User
from app.repositories.file_repository import FileRepository
from app.services.files.parser import FileParser
from app.services.rag.chunker import TextChunker
from app.services.rag.indexing_service import IndexingService


class FileService:
    allowed_suffixes = {
        ".pdf",
        ".txt",
        ".md",
        ".markdown",
        ".docx",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
    }

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = FileRepository(session)
        self.parser = FileParser()

    async def list_files(self, user: User):
        return await self.repository.list_files(user.id)

    async def upload(self, user: User, upload: UploadFile):
        settings = get_settings()
        filename = upload.filename or "untitled"
        suffix = Path(filename).suffix.lower()
        if suffix not in self.allowed_suffixes:
            raise OriginError("Unsupported file type")

        content = await upload.read()
        if len(content) > settings.max_upload_size_bytes:
            raise OriginError(f"File exceeds {settings.max_upload_size_mb} MB limit")

        user_dir = settings.upload_dir / str(user.id)
        user_dir.mkdir(parents=True, exist_ok=True)
        storage_path = user_dir / f"{uuid4()}{suffix}"
        storage_path.write_bytes(content)

        file_asset = await self.repository.create(
            user_id=user.id,
            filename=filename,
            content_type=upload.content_type,
            storage_path=str(storage_path),
            size_bytes=len(content),
            metadata={"original_filename": filename},
        )
        await self.session.flush()

        try:
            extracted_text, metadata = await self.parser.parse(storage_path, upload.content_type)
            status = FileStatus.parsed if extracted_text else FileStatus.uploaded
            await self.repository.update_parse_result(
                file_asset,
                status=status,
                extracted_text=extracted_text,
                metadata=metadata,
            )
            if extracted_text:
                await IndexingService(self.session, TextChunker()).index_file(
                    user, file_asset, extracted_text
                )
        except Exception as exc:
            await self.repository.update_parse_result(
                file_asset,
                status=FileStatus.failed,
                extracted_text=None,
                metadata={"parse_error": str(exc)},
            )

        await self.session.commit()
        await self.session.refresh(file_asset)
        return file_asset
