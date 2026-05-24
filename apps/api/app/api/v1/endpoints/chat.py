from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, DbSession
from app.schemas.chat import (
    ChatRequest,
    ConversationCreate,
    ConversationListItem,
    ConversationRead,
    ConversationUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services.chat_service import ChatService

router = APIRouter()


@router.get("/conversations", response_model=PaginatedResponse[ConversationListItem])
async def list_conversations(
    session: DbSession,
    current_user: CurrentUser,
    q: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> PaginatedResponse[ConversationListItem]:
    conversations, total = await ChatService(session).list_conversations(
        current_user, q, offset, limit
    )
    return PaginatedResponse(
        items=[ConversationListItem.model_validate(item) for item in conversations],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/conversations", response_model=ConversationRead, status_code=201)
async def create_conversation(
    payload: ConversationCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> ConversationRead:
    conversation = await ChatService(session).create_conversation(current_user, payload)
    return ConversationRead.model_validate(conversation)


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> ConversationRead:
    conversation = await ChatService(session).get_conversation(current_user, conversation_id)
    return ConversationRead.model_validate(conversation)


@router.patch("/conversations/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    conversation_id: UUID,
    payload: ConversationUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> ConversationRead:
    conversation = await ChatService(session).update_conversation(
        current_user, conversation_id, payload
    )
    return ConversationRead.model_validate(conversation)


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> None:
    service = ChatService(session)
    conversation = await service.get_conversation(current_user, conversation_id)
    await session.delete(conversation)
    await session.commit()


@router.post("/stream")
async def stream_chat(
    payload: ChatRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> StreamingResponse:
    stream = await ChatService(session).prepare_chat_stream(current_user, payload)
    return StreamingResponse(stream, media_type="text/event-stream")
