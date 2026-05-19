from time import monotonic
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response
from starlette.status import HTTP_429_TOO_MANY_REQUESTS


class InMemoryRateLimiter:
    def __init__(self, limit_per_minute: int) -> None:
        self.limit = limit_per_minute
        self.window_seconds = 60
        self.hits: dict[str, list[float]] = {}

    def allow(self, key: str) -> bool:
        now = monotonic()
        window_start = now - self.window_seconds
        timestamps = [ts for ts in self.hits.get(key, []) if ts >= window_start]
        if len(timestamps) >= self.limit:
            self.hits[key] = timestamps
            return False
        timestamps.append(now)
        self.hits[key] = timestamps
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, limit_per_minute: int) -> None:
        super().__init__(app)
        self.limiter = InMemoryRateLimiter(limit_per_minute)

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        if request.url.path in {"/health", "/docs", "/openapi.json"}:
            return await call_next(request)

        client_host = request.client.host if request.client else "unknown"
        key = f"{client_host}:{request.url.path}"
        if not self.limiter.allow(key):
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded"},
            )
        return await call_next(request)
