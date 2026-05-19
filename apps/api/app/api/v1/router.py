from fastapi import APIRouter

from app.api.v1.endpoints import auth, chat, dashboard, files, providers, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(providers.router, prefix="/providers", tags=["providers"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
