from starlette.responses import JSONResponse
from starlette.status import HTTP_403_FORBIDDEN

from app.core.security import csrf_cookie_name

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
SKIP_PATHS = {
    "/health",
    "/docs",
    "/openapi.json",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/logout",
}


class CsrfMiddleware:
    """Double-submit cookie pattern for CSRF protection.

    State-changing requests must include an X-CSRF-Token header whose value
    matches the origin_csrf_token cookie. Cross-origin sites cannot read our
    cookies, so they cannot forge the header.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "")
        path = scope["path"]

        if method in SAFE_METHODS or path in SKIP_PATHS or path.startswith("/api/v1/auth/"):
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        cookies = _parse_cookies(headers.get(b"cookie", b"").decode("latin-1"))
        csrf_cookie = cookies.get(csrf_cookie_name(), "")
        csrf_header = headers.get(b"x-csrf-token", b"").decode("latin-1")

        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            response = JSONResponse(
                status_code=HTTP_403_FORBIDDEN,
                content={"detail": "CSRF token missing or invalid"},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)


def _parse_cookies(cookie_header: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for part in cookie_header.split(";"):
        part = part.strip()
        if "=" in part:
            key, _, value = part.partition("=")
            result[key.strip()] = value.strip()
    return result
