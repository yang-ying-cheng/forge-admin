"""GLM (Zhipu AI) LLM adapter."""

import json
import uuid
from typing import Any, AsyncIterator

import httpx

from adapters.base import BaseLLMAdapter
from models.schemas import ChatMessage


class GLMAdapter(BaseLLMAdapter):
    """Adapter for Zhipu GLM API."""

    @property
    def provider_name(self) -> str:
        return "glm"

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> "ChatResponse":
        """Send chat completion request to GLM."""
        url = f"{self.api_base}/chat/completions"
        headers = self._build_headers()
        payload = self._build_payload(messages, temperature, max_tokens, stream=False, **kwargs)

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
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
        """Send streaming chat completion request to GLM."""
        url = f"{self.api_base}/chat/completions"
        headers = self._build_headers()
        payload = self._build_payload(messages, temperature, max_tokens, stream=True, **kwargs)

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def count_tokens(self, text: str) -> int:
        """Estimate token count for GLM models."""
        # GLM uses similar tokenization to GPT models
        return len(text) // 4

    def _build_headers(self) -> dict[str, str]:
        """Build request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _build_payload(
        self,
        messages: list[ChatMessage],
        temperature: float,
        max_tokens: int,
        stream: bool,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Build request payload."""
        return {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
            **kwargs,
        }

    def _parse_response(self, data: dict[str, Any]) -> "ChatResponse":
        """Parse API response into ChatResponse."""
        choice = data.get("choices", [{}])[0]
        message = choice.get("message", {})
        usage = data.get("usage", {})

        return self._build_chat_response(
            content=message.get("content", ""),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            response_id=data.get("id", str(uuid.uuid4())),
            finish_reason=choice.get("finish_reason", "stop"),
        )