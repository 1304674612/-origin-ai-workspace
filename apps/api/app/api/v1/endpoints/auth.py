from fastapi import APIRouter, Response

from app.api.deps import DbSession
from app.core.config import get_settings
from app.core.security import (
    cookie_name,
    csrf_cookie_name,
    generate_csrf_token,
    token_expires_seconds,
)
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter()


def _set_auth_cookies(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=cookie_name(),
        value=token,
        max_age=token_expires_seconds(),
        httponly=True,
        secure=settings.jwt_cookie_secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key=csrf_cookie_name(),
        value=generate_csrf_token(),
        max_age=token_expires_seconds(),
        httponly=False,
        secure=settings.jwt_cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/register", response_model=UserRead, status_code=201)
async def register(payload: RegisterRequest, session: DbSession, response: Response) -> UserRead:
    result = await AuthService(session).register(payload)
    _set_auth_cookies(response, result.access_token)
    return result.user


@router.post("/login", response_model=UserRead)
async def login(payload: LoginRequest, session: DbSession, response: Response) -> UserRead:
    result = await AuthService(session).login(payload)
    _set_auth_cookies(response, result.access_token)
    return result.user


@router.post("/logout", status_code=204)
async def logout(response: Response) -> None:
    response.delete_cookie(key=cookie_name(), path="/")
    response.delete_cookie(key=csrf_cookie_name(), path="/")
