from fastapi import APIRouter
from starlette import status

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import OriginError
from app.core.security import verify_password, hash_password
from app.schemas.user import PasswordChange, UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_me(payload: UserUpdate, current_user: CurrentUser, session: DbSession) -> UserRead:
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(current_user, key, value)
    await session.commit()
    await session.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.post("/me/password", status_code=204)
async def change_password(
    payload: PasswordChange,
    current_user: CurrentUser,
    session: DbSession,
) -> None:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise OriginError("Current password is incorrect", status.HTTP_400_BAD_REQUEST)
    current_user.password_hash = hash_password(payload.new_password)
    await session.commit()
