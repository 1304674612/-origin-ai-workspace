from typing import Literal

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_redis, get_settings
from app.core.database import engine
from app.repositories.chat_repository import ChatRepository
from app.repositories.file_repository import FileRepository
from app.repositories.knowledge_repository import KnowledgeRepository
from app.repositories.rag_repository import RagRepository
from app.schemas.dashboard import (
    DashboardStats,
    DashboardSummary,
    ServiceStatus,
    SummaryItem,
    UsagePoint,
)
from app.schemas.provider import ProviderStatus

ServiceStatusValue = Literal["ok", "degraded", "down"]

router = APIRouter()


def _to_summary_items(items: list, title_attr: str = "title", limit: int = 5) -> list[SummaryItem]:
    return [
        SummaryItem(id=item.id, title=getattr(item, title_attr), created_at=item.created_at)
        for item in items[:limit]
    ]


async def _probe_pg() -> ServiceStatusValue:
    try:
        async with engine.connect() as conn:
            await conn.exec_driver_sql("SELECT 1")
        return "ok"
    except Exception:
        return "down"


async def _probe_redis() -> ServiceStatusValue:
    try:
        redis = await get_redis()
        await redis.ping()
        return "ok"
    except Exception:
        return "down"


async def _probe_rag() -> ServiceStatusValue:
    settings = get_settings()
    if settings.openai_api_key:
        return "ok"
    return "degraded"


async def _get_services() -> list[ServiceStatus]:
    pg_status = await _probe_pg()
    redis_status = await _probe_redis()
    rag_status = await _probe_rag()
    return [
        ServiceStatus(name="FastAPI", status="ok"),
        ServiceStatus(name="PostgreSQL", status=pg_status),
        ServiceStatus(name="Redis", status=redis_status),
        ServiceStatus(name="RAG", status=rag_status),
    ]


async def _get_usage_series(user_id, chat_repository) -> list[UsagePoint]:
    daily = await chat_repository.token_usage_by_day(user_id, days=7)
    if not daily:
        return [UsagePoint(label="Today", tokens=0, latency_ms=0)]
    return [
        UsagePoint(label=entry["day"], tokens=entry["tokens"], latency_ms=0)
        for entry in daily
    ]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(session: DbSession, current_user: CurrentUser) -> DashboardStats:
    chat_repository = ChatRepository(session)
    file_repository = FileRepository(session)
    rag_repository = RagRepository(session)
    usage_total = await chat_repository.token_usage_total(current_user.id)
    settings = get_settings()
    providers: list[ProviderStatus] = [
        ProviderStatus(
            provider="openai",
            configured=bool(settings.openai_api_key),
            default_model=settings.default_model,
        ),
        ProviderStatus(
            provider="deepseek",
            configured=bool(settings.deepseek_api_key),
            default_model="deepseek-chat",
        ),
        ProviderStatus(
            provider="qwen",
            configured=bool(settings.qwen_api_key),
            default_model="qwen-plus",
        ),
        ProviderStatus(
            provider="compatible",
            configured=bool(settings.openai_compatible_base_url),
            default_model="custom",
        ),
    ]
    return DashboardStats(
        total_conversations=await chat_repository.count_conversations(current_user.id),
        total_messages=await chat_repository.count_messages(current_user.id),
        total_files=await file_repository.count_files(current_user.id),
        indexed_documents=await rag_repository.count_documents(current_user.id),
        token_usage_total=usage_total,
        provider_status=providers,
        usage_series=await _get_usage_series(current_user.id, chat_repository),
    )


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    session: DbSession, current_user: CurrentUser
) -> DashboardSummary:
    chat_repo = ChatRepository(session)
    file_repo = FileRepository(session)
    knowledge_repo = KnowledgeRepository(session)

    conversations, conversations_total = await chat_repo.list_conversations(
        current_user.id, limit=10
    )
    files, files_total = await file_repo.list_files(current_user.id, limit=10)
    knowledge_bases, kb_total = await knowledge_repo.list_bases(current_user.id, limit=10)

    services = await _get_services()
    all_ok = all(s.status == "ok" for s in services)
    system_status: ServiceStatusValue = "ok" if all_ok else "degraded"

    return DashboardSummary(
        conversations_count=conversations_total,
        files_count=files_total,
        blogs_count=kb_total,
        system_status=system_status,
        recent_conversations=_to_summary_items(conversations),
        recent_files=_to_summary_items(files, title_attr="filename"),
        recent_blogs=_to_summary_items(knowledge_bases, title_attr="name"),
        services=services,
    )
