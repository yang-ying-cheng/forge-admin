"""Factory for creating LLM adapters."""

from typing import Literal, Optional, Union

from adapters.base import BaseLLMAdapter
from adapters.deepseek import DeepSeekAdapter
from adapters.ernie import ErnieAdapter
from adapters.glm import GLMAdapter
from adapters.qwen import QwenAdapter
from config.model_config import get_model_config
from config.settings import get_settings

ProviderType = Literal["deepseek", "qwen", "glm", "ernie"]


class AdapterFactory:
    """Factory for creating LLM adapters."""

    _adapters: dict[str, BaseLLMAdapter] = {}

    @classmethod
    def get_adapter(cls, provider: Optional[Union[ProviderType, str]] = None) -> BaseLLMAdapter:
        """Get or create an adapter for the specified provider.

        Args:
            provider: Provider name, or None to use default

        Returns:
            LLM adapter instance

        Raises:
            ValueError: If provider is not supported or not configured
        """
        settings = get_settings()
        provider = provider or settings.default_provider

        # Check cache
        if provider in cls._adapters:
            return cls._adapters[provider]

        # Create new adapter
        config = get_model_config(provider)
        api_key = cls._get_api_key(provider)

        if not api_key:
            raise ValueError(f"API key not configured for provider: {provider}")

        adapter = cls._create_adapter(provider, api_key, config)
        cls._adapters[provider] = adapter
        return adapter

    @classmethod
    def _get_api_key(cls, provider: str) -> str:
        """Get API key for provider from settings."""
        settings = get_settings()
        key_mapping = {
            "deepseek": settings.deepseek_api_key,
            "qwen": settings.qwen_api_key,
            "glm": settings.glm_api_key,
            "ernie": settings.ernie_api_key,
        }
        return key_mapping.get(provider, "")

    @classmethod
    def _create_adapter(
        cls,
        provider: str,
        api_key: str,
        config,
    ) -> BaseLLMAdapter:
        """Create adapter instance for provider."""
        adapter_classes = {
            "deepseek": DeepSeekAdapter,
            "qwen": QwenAdapter,
            "glm": GLMAdapter,
            "ernie": ErnieAdapter,
        }

        adapter_class = adapter_classes.get(provider)
        if not adapter_class:
            raise ValueError(f"Unsupported provider: {provider}")

        return adapter_class(
            api_key=api_key,
            model_name=config.model_name,
            api_base=config.api_base,
        )

    @classmethod
    def get_available_providers(cls) -> list[str]:
        """Get list of providers that have API keys configured."""
        settings = get_settings()
        available = []

        if settings.deepseek_api_key:
            available.append("deepseek")
        if settings.qwen_api_key:
            available.append("qwen")
        if settings.glm_api_key:
            available.append("glm")
        if settings.ernie_api_key:
            available.append("ernie")

        return available

    @classmethod
    def clear_cache(cls) -> None:
        """Clear adapter cache."""
        cls._adapters.clear()