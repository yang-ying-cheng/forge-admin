"""API router configuration."""

from fastapi import APIRouter

from api import chat, document, health

api_router = APIRouter()

# Include sub-routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(document.router, prefix="/document", tags=["Document"])