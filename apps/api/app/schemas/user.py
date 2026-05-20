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
    username: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    preferences: dict | None = None


class PasswordChange(ORMModel):
    current_password: str
    new_password: str
