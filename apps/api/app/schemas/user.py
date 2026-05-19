from datetime import datetime
from uuid import UUID

from pydantic import EmailStr

from app.schemas.common import ORMModel


class UserRead(ORMModel):
    id: UUID
    email: EmailStr
    username: str
    full_name: str | None = None
    avatar_url: str | None = None
    preferences: dict
    created_at: datetime


class UserUpdate(ORMModel):
    full_name: str | None = None
    avatar_url: str | None = None
    preferences: dict | None = None
