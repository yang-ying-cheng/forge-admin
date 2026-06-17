"""Base adapter interface for LLM providers."""

from abc import ABC, abstractmethod
from typing import Any, AsyncIterator

from models.schemas import ChatMessage, ChatResponse, ChatUsage


class BaseLLMAdapter(ABC):
    """Abstract base class for LLM adapters."""

    def __init__(self, api_key: str, model_name: str, api_base: str):
        self.api_key = api_key
        self.model_name = model_name
        self.api_base = api_base.rstrip("/")

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name."""
        pass

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> ChatResponse:
        """Send chat completion request.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Returns:
            ChatResponse with the completion result
        """
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        """Send streaming chat completion request.

        Args:
            messages: List of chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional provider-specific parameters

        Yields:
            Chunks of the completion text
        """
        pass

    @abstractmethod
    async def count_tokens(self, text: str) -> int:
        """Count tokens in text.

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        pass

    def is_available(self) -> bool:
        """Check if the adapter is properly configured.

        Returns:
            True if the adapter has a valid API key
        """
        return bool(self.api_key)

    def _build_chat_response(
        self,
        content: str,
        prompt_tokens: int,
        completion_tokens: int,
        response_id: str,
        finish_reason: str = "stop",
    ) -> ChatResponse:
        """Build a standard ChatResponse."""
        return ChatResponse(
            id=response_id,
            provider=self.provider_name,
            model=self.model_name,
            choices=[
                {
                    "index": 0,
                    "message": ChatMessage(role="assistant", content=content),
                    "finish_reason": finish_reason,
                }
            ],
            usage=ChatUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
            ),
        )