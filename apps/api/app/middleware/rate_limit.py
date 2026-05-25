from time import monotonic

from starlette.responses import JSONResponse
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

from app.core.config import get_redis, get_settings

SKIP_PATHS = {"/health", "/docs", "/openapi.json"}
AUTH_PATHS = {"/api/v1/auth/login", "/api/v1/auth/register"}


TRUSTED_PROXIES = {"127.0.0.1", "::1", "localhost"}


def _extract_client_ip(scope: dict) -> str:
    client = scope.get("client")
    direct_ip = client[0] if client else "unknown"

    headers = dict(scope.get("headers", []))
    forwarded = headers.get(b"x-forwarded-for")
    if forwarded and direct_ip in TRUSTED_PROXIES:
        return forwarded.decode("latin-1").split(",")[0].strip()
    real_ip = headers.get(b"x-real-ip")
    if real_ip and direct_ip in TRUSTED_PROXIES:
        return real_ip.decode("latin-1")
    return direct_ip


async def _redis_allow(key: str, limit: int, window: int = 60) -> bool:
    redis = await get_redis()
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, window)
    return current <= limit


class RateLimitMiddleware:
    """Pure ASGI middleware — safe for streaming responses."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] in SKIP_PATHS:
            await self.app(scope, receive, send)
            return

        settings = get_settings()
        client_ip = _extract_client_ip(scope)
        path = scope["path"]
        key = f"rate_limit:{client_ip}:{path}"

        if path in AUTH_PATHS:
            limit = 5
            window = 60
        else:
            limit = settings.rate_limit_per_minute
            window = 60

        try:
            allowed = await _redis_allow(key, limit, window)
        except Exception:
            allowed = _inmemory_allow(key, limit, window)

        if not allowed:
            response = JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded"},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)


# In-memory fallback when Redis is unavailable
_hits: dict[str, tuple[int, list[float]]] = {}


def _inmemory_allow(key: str, limit: int, window: int = 60) -> bool:
    now = monotonic()
    window_start = now - window
    current, timestamps = _hits.get(key, (0, []))
    timestamps = [ts for ts in timestamps if ts >= window_start]
    if len(timestamps) >= limit:
        _hits[key] = (current, timestamps)
        return False
    timestamps.append(now)
    _hits[key] = (current + 1, timestamps)
    return True
