from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.core.exceptions import OriginError
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)

    async def register(self, payload: RegisterRequest) -> TokenResponse:
        if await self.users.get_by_email(payload.email):
            raise OriginError(
                "Registration failed. If you already have an account, please sign in instead.",
                status.HTTP_409_CONFLICT,
            )
        if await self.users.get_by_username(payload.username):
            raise OriginError(
                "Registration failed. If you already have an account, please sign in instead.",
                status.HTTP_409_CONFLICT,
            )

        user = await self.users.create(
            email=payload.email,
            username=payload.username,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
        )
        await self.session.commit()
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token, user=UserRead.model_validate(user))

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise OriginError("Invalid email or password", status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            raise OriginError("User is disabled", status.HTTP_403_FORBIDDEN)

        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token, user=UserRead.model_validate(user))
