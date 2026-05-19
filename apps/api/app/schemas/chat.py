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
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=32000)


class ConversationUpdate(BaseModel):
    title: str | None = None
    provider: str | None = None
    model: str | None = None
    system_prompt: str | None = None
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1, le=32000)


class ConversationRead(ORMModel):
    id: UUID
    title: str
    model: str
    provider: str
    system_prompt: str | None
    temperature: float
    max_tokens: int
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageRead] = []


class ConversationListItem(ORMModel):
    id: UUID
    title: str
    model: str
    provider: str
    updated_at: datetime


class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str = Field(min_length=1)
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    system_prompt: str | None = None
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=32000)


class ChatResponse(BaseModel):
    conversation_id: UUID
    message: ChatMessageRead
