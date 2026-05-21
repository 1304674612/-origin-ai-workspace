import logging
import os
from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

UNSAFE_JWT_SECRET_MARKERS = {
    "change-me",
    "example-secret",
    "default-secret",
    "your-secret-here",
    "replace-this",
    "change-me-with-openssl-rand-hex-32",
    "invalid_change_this",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ORIGIN AI Workspace"
    app_env: str = "development"
    app_url: AnyHttpUrl | str = "http://localhost:3000"
    api_url: AnyHttpUrl | str = "http://localhost:8000"
    api_v1_prefix: str = "/api/v1"
    current_version: str = "v0.2.0"

    jwt_secret_key: str = Field(default="")
    app_encryption_key: str = Field(default="")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24

    database_url: str = "postgresql+asyncpg://origin:origin_password@localhost:5432/origin_ai"
    redis_url: str = "redis://localhost:6379/0"

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    upload_dir: Path = Path("uploads")
    max_upload_size_mb: int = 50

    openai_api_key: str | None = None
    deepseek_api_key: str | None = None
    qwen_api_key: str | None = None
    openai_compatible_base_url: str | None = None
    default_model: str = "gpt-4o-mini"

    rate_limit_per_minute: int = 120

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


def _env_was_set(name: str) -> bool:
    return name in os.environ and os.environ[name].strip() != ""


def _warn_if_default_in_production(settings: Settings) -> None:
    if settings.app_env.lower() != "production":
        return
    if (
        not _env_was_set("DATABASE_URL")
        or settings.database_url
        == "postgresql+asyncpg://origin:origin_password@localhost:5432/origin_ai"
    ):
        logger.warning("DATABASE_URL is using the built-in default in production.")
    if not _env_was_set("REDIS_URL") or settings.redis_url == "redis://localhost:6379/0":
        logger.warning("REDIS_URL is using the built-in default in production.")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    jwt_secret = settings.jwt_secret_key.strip()
    normalized_secret = jwt_secret.lower()
    if any(marker in normalized_secret for marker in UNSAFE_JWT_SECRET_MARKERS):
        raise ValueError("Unsafe JWT secret detected. Please configure a secure production secret.")
    if not jwt_secret or len(jwt_secret) < 32:
        raise ValueError(
            "JWT_SECRET_KEY is required and must be at least 32 characters long. "
            "Generate one with: openssl rand -hex 32"
        )
    settings.jwt_secret_key = jwt_secret
    encryption_key = settings.app_encryption_key.strip()
    if not encryption_key or len(encryption_key) < 32:
        raise ValueError(
            "APP_ENCRYPTION_KEY is required and must be at least 32 characters long. "
            "Generate one with: openssl rand -hex 32"
        )
    settings.app_encryption_key = encryption_key
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    _warn_if_default_in_production(settings)
    return settings
