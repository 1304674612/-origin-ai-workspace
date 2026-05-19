from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, session: DbSession) -> TokenResponse:
    return await AuthService(session).register(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: DbSession) -> TokenResponse:
    return await AuthService(session).login(payload)
