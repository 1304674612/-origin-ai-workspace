from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.api.v1.endpoints.providers import provider_status
from app.repositories.chat_repository import ChatRepository
from app.repositories.file_repository import FileRepository
from app.repositories.rag_repository import RagRepository
from app.schemas.dashboard import DashboardStats, UsagePoint
from app.schemas.provider import ProviderStatus

router = APIRouter()


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
