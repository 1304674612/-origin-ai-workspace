from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

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
    username: str | None = Field(default=None, min_length=2, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    full_name: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    preferences: dict | None = None

    @field_validator("preferences")
    @classmethod
    def validate_preferences(cls, value: dict | None) -> dict | None:
        if value is not None and len(str(value)) > 10_000:
            raise ValueError("preferences payload is too large")
        return value


class PasswordChange(ORMModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
