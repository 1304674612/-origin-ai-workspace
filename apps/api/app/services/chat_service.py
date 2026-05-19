import json
from collections.abc import AsyncIterator
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.core.database import AsyncSessionLocal
from app.core.exceptions import OriginError
from app.models.chat import MessageRole
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import ChatRequest, ConversationCreate, ConversationUpdate
from app.services.ai.openai_provider import create_builtin_provider
from app.services.ai.types import AIMessage, ChatCompletionRequest


class ChatService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = ChatRepository(session)

    async def list_conversations(self, user: User, query: str | None = None):
        return await self.repository.list_conversations(user.id, query)

    async def create_conversation(self, user: User, payload: ConversationCreate):
        title = payload.title or "New conversation"
        conversation = await self.repository.create_conversation(
            user_id=user.id,
            title=title,
            provider=payload.provider,
            model=payload.model,
            system_prompt=payload.system_prompt,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
        await self.session.commit()
        return conversation

    async def get_conversation(self, user: User, conversation_id: UUID):
        conversation = await self.repository.get_conversation(conversation_id, user.id)
        if conversation is None:
            raise OriginError("Conversation not found", status.HTTP_404_NOT_FOUND)
        return conversation

    async def update_conversation(
        self, user: User, conversation_id: UUID, payload: ConversationUpdate
    ):
        conversation = await self.get_conversation(user, conversation_id)
        updates = payload.model_dump(exclude_unset=True)
        for key, value in updates.items():
            setattr(conversation, key, value)
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def prepare_chat_stream(self, user: User, payload: ChatRequest) -> AsyncIterator[str]:
        if payload.conversation_id:
            conversation = await self.get_conversation(user, payload.conversation_id)
            conversation.provider = payload.provider
            conversation.model = payload.model
            conversation.system_prompt = payload.system_prompt
            conversation.temperature = payload.temperature
            conversation.max_tokens = payload.max_tokens
        else:
            conversation = await self.repository.create_conversation(
                user_id=user.id,
                title=payload.message[:80],
                provider=payload.provider,
                model=payload.model,
                system_prompt=payload.system_prompt,
                temperature=payload.temperature,
                max_tokens=payload.max_tokens,
            )

        user_message = await self.repository.add_message(
            conversation_id=conversation.id,
            role=MessageRole.user,
            content=payload.message,
            token_count=max(1, len(payload.message) // 4),
        )
        await self.session.commit()

        historical_messages = await self.repository.get_conversation(conversation.id, user.id)
        if historical_messages is None:
            raise OriginError("Conversation not found", status.HTTP_404_NOT_FOUND)

        messages: list[AIMessage] = []
        if payload.system_prompt:
            messages.append(AIMessage(role="system", content=payload.system_prompt))
        for message in historical_messages.messages:
            if message.id == user_message.id:
                messages.append(AIMessage(role="user", content=payload.message))
            elif message.role in {MessageRole.user, MessageRole.assistant, MessageRole.system}:
                messages.append(AIMessage(role=message.role.value, content=message.content))

        provider = create_builtin_provider(payload.provider)
        completion_request = ChatCompletionRequest(
            provider=payload.provider,
            model=payload.model,
            messages=messages,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )

        async def event_stream() -> AsyncIterator[str]:
            chunks: list[str] = []
            yield f"event: meta\ndata: {json.dumps({'conversation_id': str(conversation.id)})}\n\n"
            try:
                async for delta in provider.stream_chat(completion_request):
                    chunks.append(delta)
                    yield f"event: token\ndata: {json.dumps({'delta': delta})}\n\n"
            except Exception as exc:
                yield f"event: error\ndata: {json.dumps({'detail': str(exc)})}\n\n"
                return

            assistant_content = "".join(chunks)
            try:
                async with AsyncSessionLocal() as stream_session:
                    stream_repository = ChatRepository(stream_session)
                    await stream_repository.add_message(
                        conversation_id=conversation.id,
                        role=MessageRole.assistant,
                        content=assistant_content,
                        token_count=max(1, len(assistant_content) // 4),
                        metadata={"provider": payload.provider, "model": payload.model},
                    )
                    await stream_session.commit()
            except Exception as exc:
                yield f"event: error\ndata: {json.dumps({'detail': str(exc)})}\n\n"
                return

            yield f"event: done\ndata: {json.dumps({'ok': True})}\n\n"

        return event_stream()
