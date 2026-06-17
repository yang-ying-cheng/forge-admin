"""Health check API endpoints."""

from datetime import datetime

from fastapi import APIRouter

from adapters.factory import AdapterFactory
from config.settings import get_settings
from models.schemas import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check service health status."""
    settings = get_settings()
    available_providers = AdapterFactory.get_available_providers()

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.utcnow(),
        providers=available_providers,
    )


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    """Check if service is ready to accept requests."""
    settings = get_settings()
    available_providers = AdapterFactory.get_available_providers()

    # Service is ready if at least one provider is configured
    if available_providers:
        return {"status": "ready", "providers": str(available_providers)}
    else:
        return {"status": "not_ready", "reason": "No LLM providers configured"}


@router.get("/live")
async def liveness_check() -> dict[str, str]:
    """Check if service is alive."""
    return {"status": "alive"}