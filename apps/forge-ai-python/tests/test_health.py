"""Tests for health check endpoints."""

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for health check API."""

    def test_health_check(self, client):
        """Test health endpoint returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data

    def test_readiness_check(self, client):
        """Test readiness endpoint."""
        response = client.get("/api/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_liveness_check(self, client):
        """Test liveness endpoint."""
        response = client.get("/api/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestDocumentEndpoints:
    """Tests for document API."""

    def test_get_document_types(self, client):
        """Test getting supported document types."""
        response = client.get("/api/document/types")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3
        extensions = [t["extension"] for t in data]
        assert "pdf" in extensions
        assert "docx" in extensions
        assert "txt" in extensions


class TestChatEndpoints:
    """Tests for chat API."""

    def test_get_providers(self, client):
        """Test getting available providers."""
        response = client.get("/api/chat/providers")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "default" in data
        assert len(data["providers"]) == 4


@pytest.mark.asyncio
async def test_async_health():
    """Test async health check."""
    from httpx import AsyncClient

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200