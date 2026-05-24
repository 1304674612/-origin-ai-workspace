import json
from collections.abc import AsyncIterator
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.core.exceptions import OriginError
from app.core.logging import logger
from app.core.tokens import count_tokens
from app.models.chat import MessageRole
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import ChatRequest, ConversationCreate, ConversationUpdate
from app.services.ai.openai_provider import create_builtin_provider
from app.services.ai.types import AIMessage, ChatCompletionRequest
from app.services.rag.embeddings import build_embedding_provider
from app.services.rag.vectorstores.postgres import PostgresVectorStore


class ChatService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = ChatRepository(session)

    async def list_conversations(
        self, user: User, query: str | None = None, offset: int = 0, limit: int = 50
    ):
        return await self.repository.list_conversations(user.id, query, offset, limit)

    async def create_conversation(self, user: User, payload: ConversationCreate):
        title = payload.title or "New conversation"
        conversation = await self.repository.create_conversation(
            user_id=user.id,
            title=title,
            provider=payload.provider,
            model=payload.model,
            system_prompt=payload.system_prompt,
            knowledge_base_id=payload.knowledge_base_id,
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
        conversation = await self._upsert_conversation(user, payload)
        user_message = await self._save_user_message(conversation.id, payload)
        messages = await self._build_messages(user, payload, conversation.id, user_message)

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
            kb_id = payload.knowledge_base_id
            yield f"event: meta\ndata: {json.dumps({'conversation_id': str(conversation.id), 'knowledge_base_id': str(kb_id) if kb_id else None})}\n\n"
            try:
                async for delta in provider.stream_chat(completion_request):
                    chunks.append(delta)
                    yield f"event: token\ndata: {json.dumps({'delta': delta})}\n\n"
            except Exception as exc:
                yield f"event: error\ndata: {json.dumps({'detail': str(exc)})}\n\n"
                return

            assistant_content = "".join(chunks)
            try:
                await self.repository.add_message(
                    conversation_id=conversation.id,
                    role=MessageRole.assistant,
                    content=assistant_content,
                    token_count=max(1, count_tokens(assistant_content, payload.model)),
                    metadata={
                        "provider": payload.provider,
                        "model": payload.model,
                        "knowledge_base_id": str(kb_id) if kb_id else None,
                    },
                )
                await self.session.commit()
            except Exception as exc:
                yield f"event: error\ndata: {json.dumps({'detail': str(exc)})}\n\n"
                return

            yield f"event: done\ndata: {json.dumps({'ok': True})}\n\n"

        return event_stream()

    async def _upsert_conversation(self, user: User, payload: ChatRequest):
        if payload.conversation_id:
            conversation = await self.get_conversation(user, payload.conversation_id)
            conversation.provider = payload.provider
            conversation.model = payload.model
            conversation.system_prompt = payload.system_prompt
            conversation.knowledge_base_id = payload.knowledge_base_id
            conversation.temperature = payload.temperature
            conversation.max_tokens = payload.max_tokens
        else:
            conversation = await self.repository.create_conversation(
                user_id=user.id,
                title=payload.message[:80],
                provider=payload.provider,
                model=payload.model,
                system_prompt=payload.system_prompt,
                knowledge_base_id=payload.knowledge_base_id,
                temperature=payload.temperature,
                max_tokens=payload.max_tokens,
            )
        await self.session.commit()
        await self.session.refresh(conversation)
        return conversation

    async def _save_user_message(self, conversation_id: UUID, payload: ChatRequest):
        message = await self.repository.add_message(
            conversation_id=conversation_id,
            role=MessageRole.user,
            content=payload.message,
            token_count=max(1, count_tokens(payload.message, payload.model)),
        )
        await self.session.commit()
        return message

    async def _build_messages(
        self, user: User, payload: ChatRequest, conversation_id: UUID, user_message
    ) -> list[AIMessage]:
        messages: list[AIMessage] = []
        if payload.system_prompt:
            messages.append(AIMessage(role="system", content=payload.system_prompt))

        if payload.knowledge_base_id is not None:
            try:
                query_vector = await build_embedding_provider().embed_query(payload.message)
                kb_session = self.session
                results = await PostgresVectorStore(kb_session).search(
                    index_name="default",
                    query_vector=query_vector,
                    knowledge_base_id=payload.knowledge_base_id,
                    limit=6,
                )
                for result in results:
                    messages.append(
                        AIMessage(
                            role="system",
                            content=(
                                "Knowledge base context:\n"
                                f"{result.text}\n"
                                f"Source: {result.metadata.get('document_title') or 'document'}"
                            ),
                        )
                    )
            except Exception:
                logger.warning(
                    "RAG retrieval failed for kb=%s", payload.knowledge_base_id, exc_info=True
                )

        historical = await self.repository.get_conversation(conversation_id, user.id)
        if historical:
            for message in historical.messages:
                if message.id == user_message.id:
                    messages.append(AIMessage(role="user", content=payload.message))
                elif message.role in {MessageRole.user, MessageRole.assistant, MessageRole.system}:
                    messages.append(AIMessage(role=message.role.value, content=message.content))

        budget = _context_budget(payload.model) - payload.max_tokens - 1024
        system_messages = [m for m in messages if m.role == "system"]
        rest = [m for m in messages if m.role != "system"]
        sys_tokens = [count_tokens(m.content, payload.model) for m in system_messages]
        rest_tokens = [count_tokens(m.content, payload.model) for m in rest]
        total = sum(sys_tokens) + sum(rest_tokens)
        while rest and total > budget:
            total -= rest_tokens.pop(0)
            rest.pop(0)

        return system_messages + rest


def _context_budget(model: str) -> int:
    model_lower = model.lower()
    if "claude" in model_lower or "o1" in model_lower or "o3" in model_lower:
        return 200_000
    if "gpt-3.5" in model_lower:
        return 16_000
    if "deepseek" in model_lower:
        return 64_000
    if "qwen" in model_lower and "turbo" in model_lower:
        return 32_000
    return 128_000
