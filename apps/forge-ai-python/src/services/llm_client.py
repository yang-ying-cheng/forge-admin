"""LLM client service."""

from typing import Any, AsyncIterator, Optional

from adapters.factory import AdapterFactory
from models.schemas import ChatMessage, ChatResponse


class LLMClient:
    """Service for interacting with LLM providers."""

    def __init__(self, provider: Optional[str] = None):
        self.default_provider = provider

    async def chat(
        self,
        messages: list[ChatMessage],
        provider: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> ChatResponse:
        """Send chat completion request.

        Args:
            messages: List of chat messages
            provider: Override provider name
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Returns:
            ChatResponse from the LLM
        """
        adapter = AdapterFactory.get_adapter(provider or self.default_provider)
        return await adapter.chat(messages, temperature, max_tokens, **kwargs)

    async def chat_stream(
        self,
        messages: list[ChatMessage],
        provider: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> AsyncIterator[str]:
        """Send streaming chat completion request.

        Args:
            messages: List of chat messages
            provider: Override provider name
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters

        Yields:
            Text chunks from the LLM
        """
        adapter = AdapterFactory.get_adapter(provider or self.default_provider)
        async for chunk in adapter.chat_stream(messages, temperature, max_tokens, **kwargs):
            yield chunk

    async def count_tokens(self, text: str, provider: Optional[str] = None) -> int:
        """Count tokens in text.

        Args:
            text: Text to count
            provider: Override provider name

        Returns:
            Estimated token count
        """
        adapter = AdapterFactory.get_adapter(provider or self.default_provider)
        return await adapter.count_tokens(text)

    @staticmethod
    def get_available_providers() -> list[str]:
        """Get list of available providers."""
        return AdapterFactory.get_available_providers()