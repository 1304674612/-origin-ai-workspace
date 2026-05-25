from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from starlette import status

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.exceptions import OriginError
from app.repositories.file_repository import FileRepository
from app.repositories.knowledge_repository import KnowledgeRepository
from app.schemas.common import PaginatedResponse
from app.schemas.knowledge import (
    KnowledgeBaseCreate,
    KnowledgeBaseRead,
    KnowledgeBaseUpdate,
    KnowledgeDocumentRead,
)
from app.services.ai.openai_provider import create_builtin_provider
from app.services.ai.types import AIMessage, ChatCompletionRequest
from app.services.rag.chunker import TextChunker
from app.services.rag.embeddings import build_embedding_provider
from app.services.rag.indexing_service import IndexingService

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


class ReindexRequest(BaseModel):
    file_id: UUID


@router.get("", response_model=PaginatedResponse[KnowledgeItem])
async def list_knowledge(
    current_user: CurrentUser,
    session: DbSession,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> PaginatedResponse[KnowledgeItem]:
    repo = KnowledgeRepository(session)
    docs, total = await repo.list_documents(
        current_user.id, source_type="ai_generated", offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[
            KnowledgeItem(
                id=doc.id,
                title=doc.title,
                content=doc.document_metadata.get("content", ""),
                created_at=doc.created_at.isoformat() if doc.created_at else "",
            )
            for doc in docs
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/generate", response_model=GenerateResponse)
async def generate_knowledge(
    payload: GenerateRequest,
    current_user: CurrentUser,
) -> GenerateResponse:
    settings = get_settings()
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
    doc = await KnowledgeRepository(session).create_document(
        user_id=current_user.id,
        title=payload.title,
        file_id=None,
        knowledge_base_id=None,
        source_type="ai_generated",
        index_name="default",
        metadata={"content": payload.content},
    )
    await session.commit()
    return {"id": str(doc.id)}


@router.get("/{doc_id:uuid}", response_model=KnowledgeItem)
async def get_knowledge(
    doc_id: UUID,
    current_user: CurrentUser,
    session: DbSession,
) -> KnowledgeItem:
    doc = await KnowledgeRepository(session).get_document(doc_id, current_user.id)
    if doc is None:
        raise OriginError("Document not found", status.HTTP_404_NOT_FOUND)
    return KnowledgeItem(
        id=doc.id,
        title=doc.title,
        content=doc.document_metadata.get("content", ""),
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


@router.get("/bases", response_model=PaginatedResponse[KnowledgeBaseRead])
async def list_bases(
    session: DbSession,
    current_user: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> PaginatedResponse[KnowledgeBaseRead]:
    bases, total = await KnowledgeRepository(session).list_bases(current_user.id, offset, limit)
    return PaginatedResponse(
        items=[KnowledgeBaseRead.model_validate(item) for item in bases],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/bases", response_model=KnowledgeBaseRead, status_code=201)
async def create_base(
    payload: KnowledgeBaseCreate,
    session: DbSession,
    current_user: CurrentUser,
) -> KnowledgeBaseRead:
    repo = KnowledgeRepository(session)
    base = await repo.create_base(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        tags=payload.tags,
    )
    await session.commit()
    await session.refresh(base)
    return KnowledgeBaseRead.model_validate(base)


@router.patch("/bases/{kb_id}", response_model=KnowledgeBaseRead)
async def update_base(
    kb_id: UUID,
    payload: KnowledgeBaseUpdate,
    session: DbSession,
    current_user: CurrentUser,
) -> KnowledgeBaseRead:
    repo = KnowledgeRepository(session)
    base = await repo.get_base(kb_id, current_user.id)
    if base is None:
        raise OriginError("Knowledge base not found", status.HTTP_404_NOT_FOUND)
    await repo.update_base(base, **payload.model_dump(exclude_unset=True))
    await session.commit()
    await session.refresh(base)
    return KnowledgeBaseRead.model_validate(base)


@router.delete("/bases/{kb_id}", status_code=204)
async def delete_base(
    kb_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> None:
    repo = KnowledgeRepository(session)
    base = await repo.get_base(kb_id, current_user.id)
    if base is None:
        raise OriginError("Knowledge base not found", status.HTTP_404_NOT_FOUND)
    await repo.delete_base(base)
    await session.commit()


@router.get("/bases/{kb_id}/documents", response_model=PaginatedResponse[KnowledgeDocumentRead])
async def list_base_documents(
    kb_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> PaginatedResponse[KnowledgeDocumentRead]:
    repo = KnowledgeRepository(session)
    base = await repo.get_base(kb_id, current_user.id)
    if base is None:
        raise OriginError("Knowledge base not found", status.HTTP_404_NOT_FOUND)
    documents, total = await repo.list_documents(
        current_user.id, kb_id=kb_id, offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[
            KnowledgeDocumentRead(
                id=doc.id,
                knowledge_base_id=doc.knowledge_base_id,
                file_id=doc.file_id,
                title=doc.title,
                source_type=doc.source_type,
                index_name=doc.index_name,
                embedding_model=doc.embedding_model,
                document_metadata=doc.document_metadata,
                chunk_count=len(doc.chunks),
                created_at=doc.created_at,
                updated_at=doc.updated_at,
            )
            for doc in documents
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/bases/{kb_id}/reindex", status_code=202)
async def reindex_base(
    kb_id: UUID,
    payload: ReindexRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> dict:
    repo = KnowledgeRepository(session)
    base = await repo.get_base(kb_id, current_user.id)
    if base is None:
        raise OriginError("Knowledge base not found", status.HTTP_404_NOT_FOUND)
    file_asset = await FileRepository(session).get(payload.file_id, current_user.id)
    if file_asset is None:
        raise OriginError("File not found", status.HTTP_404_NOT_FOUND)
    extracted_text = file_asset.extracted_text
    if not extracted_text:
        raise OriginError("File has no extracted text to index", status.HTTP_400_BAD_REQUEST)

    offset = 0
    while True:
        existing_docs, _ = await repo.list_documents(
            current_user.id, kb_id=kb_id, offset=offset, limit=200
        )
        if not existing_docs:
            break
        for doc in existing_docs:
            if doc.file_id == payload.file_id:
                await repo.delete_document(doc)
        offset += len(existing_docs)

    try:
        await IndexingService(session, TextChunker(), build_embedding_provider()).index_file(
            current_user,
            file_asset,
            extracted_text,
            knowledge_base_id=kb_id,
            metadata={"knowledge_base_id": str(kb_id)},
        )
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    return {"ok": True}
