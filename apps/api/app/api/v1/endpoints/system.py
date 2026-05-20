from fastapi import APIRouter

from app.core.config import get_settings
from app.services.system_service import get_latest_release, is_newer

router = APIRouter()


@router.get("/update-check")
async def check_update() -> dict:
    """Check if a newer version is available on GitHub."""
    settings = get_settings()
    current = settings.current_version
    latest = await get_latest_release()

    if latest is None:
        return {
            "update_available": False,
            "current_version": current,
            "error": "Unable to check GitHub for updates",
        }

    available = is_newer(current, latest["tag"])

    return {
        "update_available": available,
        "current_version": current,
        "latest_version": latest["tag"],
        "release_name": latest["name"],
        "release_url": latest["url"],
        "release_notes": latest["body"][:500] if latest["body"] else "",
    }
