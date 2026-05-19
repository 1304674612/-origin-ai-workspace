from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: str | UUID) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        email: str,
        username: str,
        password_hash: str,
        full_name: str | None = None,
    ) -> User:
        user = User(
            email=email.lower(),
            username=username,
            password_hash=password_hash,
            full_name=full_name,
        )
        self.session.add(user)
        await self.session.flush()
        return user
