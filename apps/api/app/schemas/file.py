from datetime import datetime
from uuid import UUID

from app.models.file import FileStatus
from app.schemas.common import ORMModel


class FileAssetRead(ORMModel):
    id: UUID
    filename: str
    content_type: str | None
    size_bytes: int
    status: FileStatus
    extracted_text: str | None
    file_metadata: dict
    created_at: datetime
    updated_at: datetime
