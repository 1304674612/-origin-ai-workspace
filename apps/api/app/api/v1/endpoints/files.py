from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile

from app.api.deps import CurrentUser, DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.file import FileAssetRead
from app.services.files.file_service import FileService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[FileAssetRead])
async def list_files(
    session: DbSession,
    current_user: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> PaginatedResponse[FileAssetRead]:
    files, total = await FileService(session).list_files(current_user, offset, limit)
    return PaginatedResponse(
        items=[FileAssetRead.model_validate(item) for item in files],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("", response_model=FileAssetRead, status_code=201)
async def upload_file(
    session: DbSession,
    current_user: CurrentUser,
    upload: Annotated[UploadFile, File()],
) -> FileAssetRead:
    file_asset = await FileService(session).upload(current_user, upload)
    return FileAssetRead.model_validate(file_asset)
