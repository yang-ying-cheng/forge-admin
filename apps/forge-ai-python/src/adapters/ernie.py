"""ERNIE (Baidu Wenxin) LLM adapter."""

import uuid
from typing import Any, AsyncIterator
from urllib.parse import urlencode

import httpx

from adapters.base import BaseLLMAdapter
from models.schemas import ChatMessage


class ErnieAdapter(BaseLLMAdapter):
    """Adapter for Baidu ERNIE API."""

    def __init__(self, api_key: str, model_name: str, api_base: str, secret_key: str = ""):
        super().__init__(api_key, model_name, api_base)
        self.secret_key = secret_key

    @property
    def provider_name(self) -> str:
        return "ernie"

    async def _get_access_token(self) -> str:
        """Get access token using API key and secret key."""
        url = "https://aip.baidubce.com/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("access_token", "")

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> "ChatResponse":
        """Send chat completion request to ERNIE."""
        access_token = await self._get_access_token()
        # Map model name to endpoint
        endpoint = self._get_endpoint()
        url = f"{self.api_base}/{endpoint}?access_token={access_token}"
        payload = self._build_payload(messages, temperature, max_tokens, **kwargs)

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        return self._parse_response(data)

    async def chat_stream(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        """Send streaming chat completion request to ERNIE."""
        access_token = await self._get_access_token()
        endpoint = self._get_endpoint()
        url = f"{self.api_base}/{endpoint}?access_token={access_token}&stream=true"
        payload = self._build_payload(messages, temperature, max_tokens, stream=True, **kwargs)

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        import json

                        data_str = line[6:]
                        try:
                            data = json.loads(data_str)
                            result = data.get("result", "")
                            if result:
                                yield result
                        except json.JSONDecodeError:
                            continue

    async def count_tokens(self, text: str) -> int:
        """Estimate token count for ERNIE models."""
        # ERNIE uses similar tokenization
        return len(text) // 4

    def _get_endpoint(self) -> str:
        """Get API endpoint for the model."""
        # Map model names to endpoints
        model_endpoints = {
            "ernie-4.0-8k": "completions_pro",
            "ernie-4.0": "completions_pro",
            "ernie-3.5-8k": "completions",
            "ernie-3.5": "completions",
            "ernie-speed": "ernie_speed",
            "ernie-lite": "ernie_lite",
        }
        return model_endpoints.get(self.model_name, "completions")

    def _build_payload(
        self,
        messages: list[ChatMessage],
        temperature: float,
        max_tokens: int,
        stream: bool = False,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Build request payload for ERNIE API format."""
        # ERNIE uses a different message format
        formatted_messages = []
        for m in messages:
            formatted_messages.append({"role": m.role, "content": m.content})

        return {
            "messages": formatted_messages,
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "stream": stream,
            **kwargs,
        }

    def _parse_response(self, data: dict[str, Any]) -> "ChatResponse":
        """Parse API response into ChatResponse."""
        usage = data.get("usage", {})

        return self._build_chat_response(
            content=data.get("result", ""),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            response_id=data.get("id", str(uuid.uuid4())),
            finish_reason=data.get("finish_reason", "stop"),
        )