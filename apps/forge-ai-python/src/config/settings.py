"""Configuration settings for Forge AI Python service."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Forge AI Service"
    app_version: str = "0.1.0"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # LLM Provider API Keys
    deepseek_api_key: str = ""
    qwen_api_key: str = ""
    glm_api_key: str = ""
    ernie_api_key: str = ""
    ernie_secret_key: str = ""

    # Default provider
    default_provider: Literal["deepseek", "qwen", "glm", "ernie"] = "deepseek"

    # HTTP Client
    http_timeout: int = 60
    http_max_retries: int = 3

    # Document Processing
    max_document_size: int = 10 * 1024 * 1024  # 10MB
    supported_document_types: list[str] = ["pdf", "docx", "txt"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()