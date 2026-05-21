from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import FileAsset, FileStatus


class FileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        user_id: UUID,
        filename: str,
        content_type: str | None,
        storage_path: str,
        size_bytes: int,
        metadata: dict | None = None,
    ) -> FileAsset:
        file_asset = FileAsset(
            user_id=user_id,
            filename=filename,
            content_type=content_type,
            storage_path=storage_path,
            size_bytes=size_bytes,
            file_metadata=metadata or {},
        )
        self.session.add(file_asset)
        await self.session.flush()
        return file_asset

    async def list_files(self, user_id: UUID) -> list[FileAsset]:
        result = await self.session.execute(
            select(FileAsset)
            .where(FileAsset.user_id == user_id)
            .order_by(FileAsset.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, file_id: UUID, user_id: UUID) -> FileAsset | None:
        result = await self.session.execute(
            select(FileAsset).where(
                FileAsset.id == file_id,
                FileAsset.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_parse_result(
        self,
        file_asset: FileAsset,
        *,
        status: FileStatus,
        extracted_text: str | None,
        metadata: dict | None = None,
    ) -> FileAsset:
        file_asset.status = status
        file_asset.extracted_text = extracted_text
        if metadata:
            file_asset.file_metadata = {**file_asset.file_metadata, **metadata}
        await self.session.flush()
        return file_asset

    async def count_files(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(FileAsset).where(FileAsset.user_id == user_id)
        )
        return int(result.scalar_one())
