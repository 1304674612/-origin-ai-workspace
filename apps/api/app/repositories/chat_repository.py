from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatMessage, Conversation, MessageRole


class ChatRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_conversations(
        self, user_id: UUID, query: str | None = None, offset: int = 0, limit: int = 50
    ) -> tuple[list[Conversation], int]:
        base = (
            select(Conversation)
            .where(Conversation.user_id == user_id, Conversation.is_archived.is_(False))
        )
        if query:
            base = base.where(Conversation.title.ilike(f"%{query}%"))
        total_result = await self.session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(total_result.scalar_one())
        result = await self.session.execute(
            base.order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_conversation(self, conversation_id: UUID, user_id: UUID) -> Conversation | None:
        result = await self.session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_conversation(
        self,
        *,
        user_id: UUID,
        title: str,
        provider: str,
        model: str,
        system_prompt: str | None,
        knowledge_base_id: UUID | None = None,
        temperature: float,
        max_tokens: int,
    ) -> Conversation:
        conversation = Conversation(
            user_id=user_id,
            title=title,
            provider=provider,
            model=model,
            system_prompt=system_prompt,
            knowledge_base_id=knowledge_base_id,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        self.session.add(conversation)
        await self.session.flush()
        return conversation

    async def add_message(
        self,
        *,
        conversation_id: UUID,
        role: MessageRole,
        content: str,
        token_count: int = 0,
        metadata: dict | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            token_count=token_count,
            message_metadata=metadata or {},
        )
        self.session.add(message)
        await self.session.flush()
        return message

    async def count_conversations(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(Conversation).where(Conversation.user_id == user_id)
        )
        return int(result.scalar_one())

    async def count_messages(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(ChatMessage)
            .join(Conversation)
            .where(Conversation.user_id == user_id)
        )
        return int(result.scalar_one())

    async def token_usage_total(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.coalesce(func.sum(ChatMessage.token_count), 0))
            .select_from(ChatMessage)
            .join(Conversation)
            .where(Conversation.user_id == user_id)
        )
        return int(result.scalar_one())
