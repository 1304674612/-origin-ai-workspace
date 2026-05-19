from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str


class TimestampedModel(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime | None = None
