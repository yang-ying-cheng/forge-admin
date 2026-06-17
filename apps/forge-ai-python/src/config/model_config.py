"""LLM model configuration."""

from dataclasses import dataclass
from typing import Literal


@dataclass
class ModelConfig:
    """Configuration for a specific LLM model."""

    provider: str
    model_name: str
    api_base: str
    max_tokens: int = 4096
    temperature: float = 0.7
    supports_streaming: bool = True


# Provider configurations
PROVIDER_CONFIGS: dict[str, ModelConfig] = {
    "deepseek": ModelConfig(
        provider="deepseek",
        model_name="deepseek-chat",
        api_base="https://api.deepseek.com/v1",
        max_tokens=4096,
        temperature=0.7,
    ),
    "qwen": ModelConfig(
        provider="qwen",
        model_name="qwen-turbo",
        api_base="https://dashscope.aliyuncs.com/api/v1",
        max_tokens=4096,
        temperature=0.7,
    ),
    "glm": ModelConfig(
        provider="glm",
        model_name="glm-4",
        api_base="https://open.bigmodel.cn/api/paas/v4",
        max_tokens=4096,
        temperature=0.7,
    ),
    "ernie": ModelConfig(
        provider="ernie",
        model_name="ernie-4.0-8k",
        api_base="https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
        max_tokens=4096,
        temperature=0.7,
    ),
}


def get_model_config(provider: str) -> ModelConfig:
    """Get model configuration for a provider."""
    if provider not in PROVIDER_CONFIGS:
        raise ValueError(f"Unknown provider: {provider}. Available: {list(PROVIDER_CONFIGS.keys())}")
    return PROVIDER_CONFIGS[provider]


def get_available_providers() -> list[str]:
    """Get list of available LLM providers."""
    return list(PROVIDER_CONFIGS.keys())