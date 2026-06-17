"""API endpoints module."""

from api.router import api_router
from api.chat import router as chat_router
from api.document import router as document_router
from api.health import router as health_router

__all__ = [
    "api_router",
    "chat_router",
    "document_router",
    "health_router",
]