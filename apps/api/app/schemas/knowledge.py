from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] = Field(default_factory=list)


class KnowledgeBaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] | None = None
    is_archived: bool | None = None
    is_pinned: bool | None = None
    is_favorite: bool | None = None


class KnowledgeBaseRead(ORMModel):
    id: UUID
    name: str
    description: str | None
    is_archived: bool
    is_pinned: bool
    is_favorite: bool
    tags: list[str]
    kb_metadata: dict
    created_at: datetime
    updated_at: datetime


class KnowledgeDocumentRead(ORMModel):
    id: UUID
    knowledge_base_id: UUID | None
    file_id: UUID | None
    title: str
    source_type: str
    index_name: str
    embedding_model: str | None
    document_metadata: dict
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime
