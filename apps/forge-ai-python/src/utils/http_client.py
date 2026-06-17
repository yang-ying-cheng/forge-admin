"""HTTP client utilities for external API calls."""

import asyncio
from typing import Any, Optional

import httpx

from config.settings import get_settings


class HttpClient:
    """Async HTTP client with retry logic."""

    def __init__(self, timeout: Optional[int] = None, max_retries: Optional[int] = None):
        settings = get_settings()
        self.timeout = timeout or settings.http_timeout
        self.max_retries = max_retries or settings.http_max_retries
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "HttpClient":
        """Enter async context."""
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Exit async context."""
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get the underlying HTTP client."""
        if self._client is None:
            raise RuntimeError("HttpClient not initialized. Use 'async with' context manager.")
        return self._client

    async def get(
        self,
        url: str,
        headers: Optional[dict[str, str]] = None,
        params: Optional[dict[str, Any]] = None,
    ) -> httpx.Response:
        """Make GET request with retry."""
        return await self._request("GET", url, headers=headers, params=params)

    async def post(
        self,
        url: str,
        headers: dict[str, str] | None = None,
        json: Any = None,
        data: Any = None,
    ) -> httpx.Response:
        """Make POST request with retry."""
        return await self._request("POST", url, headers=headers, json=json, data=data)

    async def _request(
        self,
        method: str,
        url: str,
        headers: Optional[dict[str, str]] = None,
        params: Optional[dict[str, Any]] = None,
        json: Any = None,
        data: Any = None,
    ) -> httpx.Response:
        """Make request with retry logic."""
        last_error: Optional[Exception] = None

        for attempt in range(self.max_retries):
            try:
                response = await self.client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json,
                    data=data,
                )
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as e:
                # Don't retry on client errors (4xx)
                if 400 <= e.response.status_code < 500:
                    raise
                last_error = e
            except httpx.RequestError as e:
                last_error = e

            if attempt < self.max_retries - 1:
                await asyncio.sleep(2**attempt)  # Exponential backoff

        raise last_error or RuntimeError("Request failed after retries")


async def create_http_client() -> HttpClient:
    """Factory function to create HTTP client."""
    return HttpClient()