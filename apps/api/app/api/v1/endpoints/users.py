from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserRead, UserUpdate

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
