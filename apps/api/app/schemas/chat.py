from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.chat import MessageRole
from app.schemas.common import ORMModel


class ChatMessageCreate(BaseModel):
    role: MessageRole
    content: str = Field(min_length=1)


class ChatMessageRead(ORMModel):
    id: UUID
    role: MessageRole
    content: str
    token_count: int
    message_metadata: dict
    created_at: datetime


class ConversationCreate(BaseModel):
    title: str | None = None
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    system_prompt: str | None = None
    knowledge_base_id: UUID | None = None
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=32000)


class ConversationUpdate(BaseModel):
    title: str | None = None
    provider: str | None = None
    model: str | None = None
    system_prompt: str | None = None
    knowledge_base_id: UUID | None = None
    is_archived: bool | None = None
    is_pinned: bool | None = None
    is_favorite: bool | None = None
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1, le=32000)


class ConversationRead(ORMModel):
    id: UUID
    title: str
    model: str
    provider: str
    system_prompt: str | None
    knowledge_base_id: UUID | None
    is_archived: bool
    is_pinned: bool
    is_favorite: bool
    temperature: float
    max_tokens: int
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageRead] = Field(default_factory=list)


class ConversationListItem(ORMModel):
    id: UUID
    title: str
    model: str
    provider: str
    knowledge_base_id: UUID | None
    is_archived: bool
    is_pinned: bool
    is_favorite: bool
    updated_at: datetime


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=32000)
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    system_prompt: str | None = Field(default=None, max_length=8000)
    knowledge_base_id: UUID | None = None
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=128000)


class ChatResponse(BaseModel):
    conversation_id: UUID
    message: ChatMessageRead
