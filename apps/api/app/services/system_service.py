import re

import httpx

GITHUB_API = "https://api.github.com/repos/1304674612/-origin-ai-workspace/releases/latest"


async def get_latest_release() -> dict | None:
    """Fetch the latest GitHub release info. Returns None on failure."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(GITHUB_API)
            if response.status_code != 200:
                return None
            data = response.json()
            return {
                "tag": data.get("tag_name", ""),
                "name": data.get("name", ""),
                "url": data.get("html_url", ""),
                "body": data.get("body", ""),
            }
    except Exception:
        return None


def parse_version(tag: str) -> tuple[int, int, int]:
    """Parse 'v0.2.0' -> (0, 2, 0)."""
    match = re.match(r"v?(\d+)\.(\d+)\.(\d+)", tag)
    if match:
        return int(match.group(1)), int(match.group(2)), int(match.group(3))
    return (0, 0, 0)


def is_newer(current: str, latest: str) -> bool:
    """Return True if latest is newer than current."""
    return parse_version(latest) > parse_version(current)
