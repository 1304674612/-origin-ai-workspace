from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.api.v1.endpoints.providers import provider_status
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

router = APIRouter()


def _to_summary_items(items: list, title_attr: str = "title", limit: int = 5) -> list[SummaryItem]:
    return [
        SummaryItem(id=item.id, title=getattr(item, title_attr), created_at=item.created_at)
        for item in items[:limit]
    ]


def _get_services() -> list[ServiceStatus]:
    # TODO: replace with real health probes (DB ping, Redis ping, RAG readiness)
    return [
        ServiceStatus(name="FastAPI", status="ok"),
        ServiceStatus(name="PostgreSQL", status="ok"),
        ServiceStatus(name="Redis", status="ok"),
        ServiceStatus(name="RAG", status="ok"),
    ]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(session: DbSession, current_user: CurrentUser) -> DashboardStats:
    chat_repository = ChatRepository(session)
    file_repository = FileRepository(session)
    rag_repository = RagRepository(session)
    usage_total = await chat_repository.token_usage_total(current_user.id)
    providers: list[ProviderStatus] = await provider_status()
    return DashboardStats(
        total_conversations=await chat_repository.count_conversations(current_user.id),
        total_messages=await chat_repository.count_messages(current_user.id),
        total_files=await file_repository.count_files(current_user.id),
        indexed_documents=await rag_repository.count_documents(current_user.id),
        token_usage_today=usage_total,
        provider_status=providers,
        usage_series=[
            UsagePoint(label="Mon", tokens=max(120, usage_total // 7), latency_ms=180),
            UsagePoint(label="Tue", tokens=max(240, usage_total // 6), latency_ms=164),
            UsagePoint(label="Wed", tokens=max(180, usage_total // 5), latency_ms=158),
            UsagePoint(label="Thu", tokens=max(320, usage_total // 4), latency_ms=149),
            UsagePoint(label="Fri", tokens=max(460, usage_total // 3), latency_ms=141),
            UsagePoint(label="Sat", tokens=max(280, usage_total // 5), latency_ms=176),
            UsagePoint(label="Sun", tokens=max(390, usage_total // 4), latency_ms=153),
        ],
    )


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    session: DbSession, current_user: CurrentUser
) -> DashboardSummary:
    chat_repo = ChatRepository(session)
    file_repo = FileRepository(session)
    knowledge_repo = KnowledgeRepository(session)

    conversations = await chat_repo.list_conversations(current_user.id)
    files = await file_repo.list_files(current_user.id)
    knowledge_bases = await knowledge_repo.list_bases(current_user.id)

    return DashboardSummary(
        conversations_count=len(conversations),
        files_count=len(files),
        blogs_count=len(knowledge_bases),
        system_status="ok",
        recent_conversations=_to_summary_items(conversations),
        recent_files=_to_summary_items(files, title_attr="filename"),
        recent_blogs=_to_summary_items(knowledge_bases, title_attr="name"),
        services=_get_services(),
    )
