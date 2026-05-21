from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlalchemy import select
from starlette import status

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.exceptions import OriginError
from app.models.rag import KnowledgeDocument
from app.services.ai.openai_provider import create_builtin_provider
from app.services.ai.types import AIMessage, ChatCompletionRequest

router = APIRouter()


class GenerateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=260)


class GenerateResponse(BaseModel):
    content: str


class SaveRequest(BaseModel):
    title: str
    content: str


class KnowledgeItem(BaseModel):
    id: UUID
    title: str
    content: str
    created_at: str

    model_config = {"from_attributes": True}


@router.post("/generate", response_model=GenerateResponse)
async def generate_knowledge(
    payload: GenerateRequest,
    current_user: CurrentUser,
) -> GenerateResponse:
    """Use the default AI model to generate knowledge content from a title."""
    settings = get_settings()

    # Find the first configured provider
    provider_name = "deepseek"
    api_key = settings.deepseek_api_key
    if not api_key:
        provider_name = "openai"
        api_key = settings.openai_api_key
    if not api_key:
        provider_name = "qwen"
        api_key = settings.qwen_api_key
    if not api_key:
        raise OriginError(
            "No AI provider configured. Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env",
            status.HTTP_400_BAD_REQUEST,
        )

    provider = create_builtin_provider(provider_name)
    system_prompt = (
        "You are a technical knowledge writer. Given a topic title, write a concise, "
        "well-structured knowledge article in Markdown format. Include key concepts, "
        "practical examples, and best practices. Aim for 300-800 words. "
        "Use Chinese if the title is in Chinese, otherwise use English."
    )

    request = ChatCompletionRequest(
        provider=provider_name,
        model=settings.default_model,
        messages=[
            AIMessage(role="system", content=system_prompt),
            AIMessage(role="user", content=f"Write a knowledge article about: {payload.title}"),
        ],
        temperature=0.7,
        max_tokens=2048,
    )

    chunks: list[str] = []
    async for delta in provider.stream_chat(request):
        chunks.append(delta)

    return GenerateResponse(content="".join(chunks))


@router.post("", status_code=201)
async def save_knowledge(
    payload: SaveRequest,
    current_user: CurrentUser,
    session: DbSession,
) -> dict:
    doc = KnowledgeDocument(
        user_id=current_user.id,
        title=payload.title,
        source_type="ai_generated",
        document_metadata={"content": payload.content},
    )
    session.add(doc)
    await session.commit()
    return {"id": str(doc.id)}


@router.get("", response_model=list[KnowledgeItem])
async def list_knowledge(
    current_user: CurrentUser,
    session: DbSession,
) -> list[KnowledgeItem]:
    result = await session.execute(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.user_id == current_user.id)
        .order_by(KnowledgeDocument.created_at.desc())
    )
    docs = result.scalars().all()
    return [
        KnowledgeItem(
            id=doc.id,
            title=doc.title,
            content=doc.document_metadata.get("content", ""),
            created_at=doc.created_at.isoformat() if doc.created_at else "",
        )
        for doc in docs
    ]


@router.get("/{doc_id}", response_model=KnowledgeItem)
async def get_knowledge(
    doc_id: UUID,
    current_user: CurrentUser,
    session: DbSession,
) -> KnowledgeItem:
    result = await session.execute(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == doc_id,
            KnowledgeDocument.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise OriginError("Document not found", status.HTTP_404_NOT_FOUND)

    return KnowledgeItem(
        id=doc.id,
        title=doc.title,
        content=doc.document_metadata.get("content", ""),
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )
