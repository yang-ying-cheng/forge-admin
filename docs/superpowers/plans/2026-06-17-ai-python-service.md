# Python AI 服务实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建独立的 Python AI 服务（forge-ai-python），使用 FastAPI + uv 虚拟环境，提供文档解析、摘要生成、对话推理等 API。

**Architecture:** FastAPI 异步服务，支持多模型适配（通义千问、文心一言、DeepSeek、智谱GLM），通过 HTTP 调用大模型 API。

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, httpx, pypdf, python-docx, Pydantic, uv

---

## 文件结构

### 新建文件

```
apps/forge-ai-python/
├── pyproject.toml
├── .env.example
├── src/
│   ├── main.py
│   ├── config/
│   │   ├── settings.py
│   │   └── model_config.py
│   ├── api/
│   │   ├── router.py
│   │   ├── chat.py
│   │   ├── document.py
│   │   ├── embedding.py
│   │   ├── health.py
│   ├── services/
│   │   ├── document_parser.py
│   │   ├── llm_client.py
│   │   ├── summarizer.py
│   ├── adapters/
│   │   ├── base.py
│   │   ├── qwen.py
│   │   ├── ernie.py
│   │   ├── deepseek.py
│   │   ├── glm.py
│   │   ├── factory.py
│   ├── models/
│   │   └── schemas.py
│   └── utils/
│       └── http_client.py
├── tests/
│   └── test_health.py
├── Dockerfile
└── README.md
```

---

### Task 1: 创建项目结构和 pyproject.toml

**Files:**
- Create: `apps/forge-ai-python/pyproject.toml`
- Create: `apps/forge-ai-python/.env.example`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p apps/forge-ai-python/src/config
mkdir -p apps/forge-ai-python/src/api
mkdir -p apps/forge-ai-python/src/services
mkdir -p apps/forge-ai-python/src/adapters
mkdir -p apps/forge-ai-python/src/models
mkdir -p apps/forge-ai-python/src/utils
mkdir -p apps/forge-ai-python/tests
```

- [ ] **Step 2: 创建 pyproject.toml**

```toml
[project]
name = "forge-ai-python"
version = "0.1.0"
description = "AI 服务 - 文档解析与对话推理"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.27.0",
    "httpx>=0.27.0",
    "pypdf>=4.0.0",
    "python-docx>=1.1.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.uv]
dev-dependencies = ["pytest", "pytest-asyncio"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3: 创建 .env.example**

```bash
# 各模型 API Key
QWEN_API_KEY=sk-xxx
ERNIE_API_KEY=xxx
DEEPSEEK_API_KEY=sk-xxx
GLM_API_KEY=xxx

# 默认模型
DEFAULT_MODEL_PROVIDER=deepseek

# 服务端口
PORT=8001

# Java 服务地址（用于回调）
JAVA_SERVICE_URL=http://localhost:8181/api
```

- [ ] **Step 4: Commit**

```bash
git add apps/forge-ai-python/pyproject.toml apps/forge-ai-python/.env.example
git commit -m "feat(ai-python): 创建项目结构和 pyproject.toml"
```

---

### Task 2: 创建配置模块

**Files:**
- Create: `apps/forge-ai-python/src/config/settings.py`
- Create: `apps/forge-ai-python/src/config/model_config.py`

- [ ] **Step 1: 创建 settings.py**

```python
"""配置管理模块"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置"""
    
    # 服务配置
    port: int = 8001
    debug: bool = False
    
    # 模型 API Keys
    qwen_api_key: Optional[str] = None
    ernie_api_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    glm_api_key: Optional[str] = None
    
    # 默认模型
    default_model_provider: str = "deepseek"
    
    # Java 服务地址
    java_service_url: str = "http://localhost:8181/api"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

- [ ] **Step 2: 创建 model_config.py**

```python
"""模型配置"""
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ModelConfig:
    """单个模型配置"""
    provider: str
    model_name: str
    api_url: str
    api_key: Optional[str] = None
    max_tokens: int = 4096
    temperature: float = 0.7


# 各提供商默认配置
MODEL_CONFIGS: Dict[str, ModelConfig] = {
    "deepseek": ModelConfig(
        provider="deepseek",
        model_name="deepseek-chat",
        api_url="https://api.deepseek.com/v1",
        max_tokens=4096,
        temperature=0.7,
    ),
    "qwen": ModelConfig(
        provider="qwen",
        model_name="qwen-turbo",
        api_url="https://dashscope.aliyuncs.com/api/v1",
        max_tokens=4096,
        temperature=0.7,
    ),
    "glm": ModelConfig(
        provider="glm",
        model_name="glm-4-flash",
        api_url="https://open.bigmodel.cn/api/paas/v4",
        max_tokens=4096,
        temperature=0.7,
    ),
    "ernie": ModelConfig(
        provider="ernie",
        model_name="ernie-bot-4",
        api_url="https://aip.baidubce.com/rpc/2.0",
        max_tokens=4096,
        temperature=0.7,
    ),
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/forge-ai-python/src/config/
git commit -m "feat(ai-python): 添加配置模块 settings 和 model_config"
```

---

### Task 3: 创建数据模型（Pydantic schemas）

**Files:**
- Create: `apps/forge-ai-python/src/models/schemas.py`

- [ ] **Step 1: 创建 schemas.py**

```python
"""API 数据模型"""
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class ModelProvider(str, Enum):
    """模型提供商"""
    QWEN = "qwen"
    ERNIE = "ernie"
    DEEPSEEK = "deepseek"
    GLM = "glm"


class MessageRole(str, Enum):
    """消息角色"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """单条消息"""
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    """对话请求"""
    messages: List[ChatMessage]
    model_provider: Optional[ModelProvider] = None
    model_name: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    stream: bool = False


class ChatResponse(BaseModel):
    """对话响应"""
    content: str
    model_provider: str
    model_name: str
    tokens_used: Optional[int] = None


class DocumentParseRequest(BaseModel):
    """文档解析请求"""
    file_path: str
    file_type: str  # pdf, docx, txt


class DocumentParseResponse(BaseModel):
    """文档解析响应"""
    content: str
    file_name: str
    page_count: Optional[int] = None


class SummaryRequest(BaseModel):
    """摘要生成请求"""
    content: str
    model_provider: Optional[ModelProvider] = None
    max_length: Optional[int] = 500


class SummaryResponse(BaseModel):
    """摘要生成响应"""
    summary: str
    model_provider: str
    model_name: str


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    models_available: List[str]


class ErrorResponse(BaseModel):
    """错误响应"""
    error_code: str
    message: str
    details: Optional[dict] = None
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-ai-python/src/models/
git commit -m "feat(ai-python): 添加 Pydantic 数据模型 schemas"
```

---

### Task 4: 创建 HTTP 客户端工具

**Files:**
- Create: `apps/forge-ai-python/src/utils/http_client.py`

- [ ] **Step 1: 创建 http_client.py**

```python
"""HTTP 客户端工具"""
import httpx
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager


class HttpClient:
    """异步 HTTP 客户端"""
    
    def __init__(self, timeout: float = 30.0):
        self._client: Optional[httpx.AsyncClient] = None
        self._timeout = timeout
    
    async def init(self):
        """初始化客户端"""
        self._client = httpx.AsyncClient(timeout=self._timeout)
    
    async def close(self):
        """关闭客户端"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def post(
        self,
        url: str,
        json: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        """POST 请求"""
        if not self._client:
            await self.init()
        return await self._client.post(url, json=json, headers=headers)
    
    async def get(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        """GET 请求"""
        if not self._client:
            await self.init()
        return await self._client.get(url, headers=headers)


# 全局客户端实例
http_client = HttpClient(timeout=60.0)
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-ai-python/src/utils/
git commit -m "feat(ai-python): 添加 HTTP 客户端工具"
```

---

### Task 5: 创建模型适配器基础类

**Files:**
- Create: `apps/forge-ai-python/src/adapters/base.py`
- Create: `apps/forge-ai-python/src/adapters/factory.py`

- [ ] **Step 1: 创建 base.py**

```python
"""模型适配器基类"""
from abc import ABC, abstractmethod
from typing import List, AsyncIterator, Optional
from ..models.schemas import ChatMessage, ModelProvider
from ..utils.http_client import http_client


class BaseAdapter(ABC):
    """模型适配器基类"""
    
    @property
    @abstractmethod
    def provider(self) -> ModelProvider:
        """提供商标识"""
        pass
    
    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        """对话推理"""
        pass
    
    @abstractmethod
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        """流式对话"""
        pass
    
    @abstractmethod
    async def summarize(
        self,
        content: str,
        max_length: Optional[int] = 500,
    ) -> str:
        """生成摘要"""
        pass
    
    async def is_available(self) -> bool:
        """检查是否可用"""
        try:
            # 简单检查：有 API key 则认为可用
            return True
        except Exception:
            return False
    
    def _build_messages(self, messages: List[ChatMessage]) -> List[dict]:
        """构建消息列表"""
        return [{"role": m.role.value, "content": m.content} for m in messages]
```

- [ ] **Step 2: 创建 factory.py**

```python
"""模型适配器工厂"""
from typing import Dict, Optional
from ..models.schemas import ModelProvider
from ..config.settings import settings
from .base import BaseAdapter
from .qwen import QwenAdapter
from .deepseek import DeepSeekAdapter
from .glm import GlmAdapter
from .ernie import ErnieAdapter


class AdapterFactory:
    """适配器工厂"""
    
    _adapters: Dict[ModelProvider, BaseAdapter] = {}
    
    def __init__(self):
        self._init_adapters()
    
    def _init_adapters(self):
        """初始化适配器"""
        self._adapters = {
            ModelProvider.DEEPSEEK: DeepSeekAdapter(),
            ModelProvider.QWEN: QwenAdapter(),
            ModelProvider.GLM: GlmAdapter(),
            ModelProvider.ERNIE: ErnieAdapter(),
        }
    
    def get_adapter(self, provider: Optional[ModelProvider] = None) -> BaseAdapter:
        """获取适配器"""
        if provider is None:
            # 使用默认模型
            default = settings.default_model_provider
            provider = ModelProvider(default)
        
        adapter = self._adapters.get(provider)
        if not adapter:
            raise ValueError(f"Unknown provider: {provider}")
        return adapter
    
    def get_available_providers(self) -> List[str]:
        """获取可用提供商列表"""
        return [p.value for p in self._adapters.keys()]


# 全局工厂实例
adapter_factory = AdapterFactory()
```

- [ ] **Step 3: Commit**

```bash
git add apps/forge-ai-python/src/adapters/base.py apps/forge-ai-python/src/adapters/factory.py
git commit -m "feat(ai-python): 添加模型适配器基类和工厂"
```

---

### Task 6: 创建 DeepSeek 适配器

**Files:**
- Create: `apps/forge-ai-python/src/adapters/deepseek.py`

- [ ] **Step 1: 创建 deepseek.py**

```python
"""DeepSeek 模型适配器"""
import json
from typing import List, AsyncIterator, Optional
from ..models.schemas import ChatMessage, ModelProvider
from ..config.settings import settings
from ..config.model_config import MODEL_CONFIGS
from ..utils.http_client import http_client
from .base import BaseAdapter


class DeepSeekAdapter(BaseAdapter):
    """DeepSeek 适配器"""
    
    @property
    def provider(self) -> ModelProvider:
        return ModelProvider.DEEPSEEK
    
    def _get_api_key(self) -> str:
        """获取 API Key"""
        key = settings.deepseek_api_key
        if not key:
            raise ValueError("DeepSeek API Key not configured")
        return key
    
    async def chat(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        """对话推理"""
        config = MODEL_CONFIGS["deepseek"]
        url = f"{config.api_url}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self._get_api_key()}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": model_name or config.model_name,
            "messages": self._build_messages(messages),
            "max_tokens": max_tokens or config.max_tokens,
            "temperature": temperature or config.temperature,
        }
        
        response = await http_client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        """流式对话"""
        config = MODEL_CONFIGS["deepseek"]
        url = f"{config.api_url}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self._get_api_key()}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": model_name or config.model_name,
            "messages": self._build_messages(messages),
            "max_tokens": max_tokens or config.max_tokens,
            "temperature": temperature or config.temperature,
            "stream": True,
        }
        
        # 使用 httpx 流式请求
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
    
    async def summarize(
        self,
        content: str,
        max_length: Optional[int] = 500,
    ) -> str:
        """生成摘要"""
        messages = [
            ChatMessage(role="system", content="你是一个专业的文档摘要助手。请为用户提供简洁、准确的文档摘要。"),
            ChatMessage(role="user", content=f"请为以下内容生成摘要，控制在{max_length}字以内：\n\n{content}"),
        ]
        return await self.chat(messages)
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-ai-python/src/adapters/deepseek.py
git commit -m "feat(ai-python): 添加 DeepSeek 模型适配器"
```

---

### Task 7: 创建其他模型适配器

**Files:**
- Create: `apps/forge-ai-python/src/adapters/qwen.py`
- Create: `apps/forge-ai-python/src/adapters/glm.py`
- Create: `apps/forge-ai-python/src/adapters/ernie.py`

- [ ] **Step 1: 创建 qwen.py**

```python
"""通义千问模型适配器"""
import json
from typing import List, AsyncIterator, Optional
from ..models.schemas import ChatMessage, ModelProvider
from ..config.settings import settings
from ..config.model_config import MODEL_CONFIGS
from ..utils.http_client import http_client
from .base import BaseAdapter


class QwenAdapter(BaseAdapter):
    """通义千问适配器"""
    
    @property
    def provider(self) -> ModelProvider:
        return ModelProvider.QWEN
    
    def _get_api_key(self) -> str:
        key = settings.qwen_api_key
        if not key:
            raise ValueError("Qwen API Key not configured")
        return key
    
    async def chat(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        config = MODEL_CONFIGS["qwen"]
        url = f"{config.api_url}/services/aigc/text-generation/generation"
        
        headers = {
            "Authorization": f"Bearer {self._get_api_key()}",
            "Content-Type": "application/json",
        }
        
        # 通义千问 API 格式
        payload = {
            "model": model_name or config.model_name,
            "input": {
                "messages": self._build_messages(messages),
            },
            "parameters": {
                "max_tokens": max_tokens or config.max_tokens,
                "temperature": temperature or config.temperature,
            },
        }
        
        response = await http_client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        return data["output"]["text"]
    
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        # 通义千问流式接口略有不同，简化处理
        content = await self.chat(messages, model_name, max_tokens, temperature)
        yield content
    
    async def summarize(
        self,
        content: str,
        max_length: Optional[int] = 500,
    ) -> str:
        messages = [
            ChatMessage(role="system", content="你是文档摘要专家。请生成简洁准确的摘要。"),
            ChatMessage(role="user", content=f"请为以下内容生成摘要（{max_length}字以内）：\n\n{content}"),
        ]
        return await self.chat(messages)
```

- [ ] **Step 2: 创建 glm.py**

```python
"""智谱GLM模型适配器"""
import json
from typing import List, AsyncIterator, Optional
from ..models.schemas import ChatMessage, ModelProvider
from ..config.settings import settings
from ..config.model_config import MODEL_CONFIGS
from ..utils.http_client import http_client
from .base import BaseAdapter


class GlmAdapter(BaseAdapter):
    """智谱GLM适配器"""
    
    @property
    def provider(self) -> ModelProvider:
        return ModelProvider.GLM
    
    def _get_api_key(self) -> str:
        key = settings.glm_api_key
        if not key:
            raise ValueError("GLM API Key not configured")
        return key
    
    async def chat(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        config = MODEL_CONFIGS["glm"]
        url = f"{config.api_url}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self._get_api_key()}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": model_name or config.model_name,
            "messages": self._build_messages(messages),
            "max_tokens": max_tokens or config.max_tokens,
            "temperature": temperature or config.temperature,
        }
        
        response = await http_client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]
    
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        # 简化：直接返回完整响应
        content = await self.chat(messages, model_name, max_tokens, temperature)
        yield content
    
    async def summarize(
        self,
        content: str,
        max_length: Optional[int] = 500,
    ) -> str:
        messages = [
            ChatMessage(role="system", content="你是专业的文档摘要助手。"),
            ChatMessage(role="user", content=f"请为以下内容生成摘要（控制在{max_length}字）：\n\n{content}"),
        ]
        return await self.chat(messages)
```

- [ ] **Step 3: 创建 ernie.py**

```python
"""文心一言模型适配器"""
from typing import List, AsyncIterator, Optional
from ..models.schemas import ChatMessage, ModelProvider
from ..config.settings import settings
from ..config.model_config import MODEL_CONFIGS
from ..utils.http_client import http_client
from .base import BaseAdapter


class ErnieAdapter(BaseAdapter):
    """文心一言适配器"""
    
    @property
    def provider(self) -> ModelProvider:
        return ModelProvider.ERNIE
    
    def _get_api_key(self) -> str:
        key = settings.ernie_api_key
        if not key:
            raise ValueError("Ernie API Key not configured")
        return key
    
    async def chat(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        # 文心一言需要 access_token，简化实现
        config = MODEL_CONFIGS["ernie"]
        
        # 这里简化处理，实际需要获取 access_token
        # 文心一言 API 格式与 OpenAI 不同
        raise NotImplementedError("Ernie adapter needs access_token implementation")
    
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        raise NotImplementedError("Ernie adapter needs stream implementation")
    
    async def summarize(
        self,
        content: str,
        max_length: Optional[int] = 500,
    ) -> str:
        raise NotImplementedError("Ernie adapter implementation pending")
```

- [ ] **Step 4: Commit**

```bash
git add apps/forge-ai-python/src/adapters/
git commit -m "feat(ai-python): 添加通义千问、智谱GLM、文心一言适配器"
```

---

### Task 8: 创建文档解析服务

**Files:**
- Create: `apps/forge-ai-python/src/services/document_parser.py`

- [ ] **Step 1: 创建 document_parser.py**

```python
"""文档解析服务"""
from typing import Optional
from pathlib import Path
from pypdf import PdfReader
from docx import Document


class DocumentParser:
    """文档解析器"""
    
    async def parse_pdf(self, file_path: str) -> tuple[str, int]:
        """解析 PDF 文件"""
        reader = PdfReader(file_path)
        pages = reader.pages
        page_count = len(pages)
        
        content_parts = []
        for page in pages:
            text = page.extract_text()
            if text:
                content_parts.append(text)
        
        content = "\n\n".join(content_parts)
        return content, page_count
    
    async def parse_docx(self, file_path: str) -> tuple[str, Optional[int]]:
        """解析 Word 文件"""
        doc = Document(file_path)
        
        content_parts = []
        for para in doc.paragraphs:
            if para.text.strip():
                content_parts.append(para.text)
        
        # 提取表格内容
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells)
                if row_text.strip():
                    content_parts.append(row_text)
        
        content = "\n".join(content_parts)
        return content, None
    
    async def parse_txt(self, file_path: str) -> tuple[str, Optional[int]]:
        """解析纯文本文件"""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content, None
    
    async def parse(self, file_path: str, file_type: str) -> tuple[str, Optional[int]]:
        """解析文档"""
        file_type = file_type.lower()
        
        if file_type == "pdf":
            return await self.parse_pdf(file_path)
        elif file_type in ("docx", "doc"):
            return await self.parse_docx(file_path)
        elif file_type == "txt":
            return await self.parse_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")


# 全局解析器实例
document_parser = DocumentParser()
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-ai-python/src/services/document_parser.py
git commit -m "feat(ai-python): 添加文档解析服务（PDF、Word、TXT）"
```

---

### Task 9: 创建 LLM 客户端和摘要服务

**Files:**
- Create: `apps/forge-ai-python/src/services/llm_client.py`
- Create: `apps/forge-ai-python/src/services/summarizer.py`

- [ ] **Step 1: 创建 llm_client.py**

```python
"""LLM 调用客户端"""
from typing import List, Optional, AsyncIterator
from ..models.schemas import ChatMessage, ChatResponse, ModelProvider
from ..adapters.factory import adapter_factory


class LlmClient:
    """LLM 调用客户端"""
    
    async def chat(
        self,
        messages: List[ChatMessage],
        model_provider: Optional[ModelProvider] = None,
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> ChatResponse:
        """对话推理"""
        adapter = adapter_factory.get_adapter(model_provider)
        content = await adapter.chat(
            messages,
            model_name,
            max_tokens,
            temperature,
        )
        
        return ChatResponse(
            content=content,
            model_provider=adapter.provider.value,
            model_name=model_name or "default",
        )
    
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        model_provider: Optional[ModelProvider] = None,
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        """流式对话"""
        adapter = adapter_factory.get_adapter(model_provider)
        async for chunk in adapter.chat_stream(
            messages,
            model_name,
            max_tokens,
            temperature,
        ):
            yield chunk
    
    async def get_available_models(self) -> List[str]:
        """获取可用模型列表"""
        return adapter_factory.get_available_providers()


# 全局客户端实例
llm_client = LlmClient()
```

- [ ] **Step 2: 创建 summarizer.py**

```python
"""摘要生成服务"""
from typing import Optional
from ..models.schemas import ModelProvider
from ..adapters.factory import adapter_factory


class Summarizer:
    """摘要生成器"""
    
    async def summarize(
        self,
        content: str,
        model_provider: Optional[ModelProvider] = None,
        max_length: Optional[int] = 500,
    ) -> tuple[str, str, str]:
        """生成摘要"""
        adapter = adapter_factory.get_adapter(model_provider)
        summary = await adapter.summarize(content, max_length)
        
        return summary, adapter.provider.value, "default"


# 全局摘要器实例
summarizer = Summarizer()
```

- [ ] **Step 3: Commit**

```bash
git add apps/forge-ai-python/src/services/
git commit -m "feat(ai-python): 添加 LLM 客户端和摘要服务"
```

---

### Task 10: 创建 API 路由

**Files:**
- Create: `apps/forge-ai-python/src/api/router.py`
- Create: `apps/forge-ai-python/src/api/chat.py`
- Create: `apps/forge-ai-python/src/api/document.py`
- Create: `apps/forge-ai-python/src/api/health.py`

- [ ] **Step 1: 创建 router.py**

```python
"""API 路由注册"""
from fastapi import APIRouter
from .chat import router as chat_router
from .document import router as document_router
from .health import router as health_router


# 创建主路由
router = APIRouter()

# 注册子路由
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(document_router, prefix="/document", tags=["document"])
router.include_router(health_router, tags=["health"])
```

- [ ] **Step 2: 创建 chat.py**

```python
"""对话 API"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ..models.schemas import ChatRequest, ChatResponse
from ..services.llm_client import llm_client

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """对话推理"""
    return await llm_client.chat(
        messages=request.messages,
        model_provider=request.model_provider,
        model_name=request.model_name,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
    )


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """流式对话"""
    async def generate():
        async for chunk in llm_client.chat_stream(
            messages=request.messages,
            model_provider=request.model_provider,
            model_name=request.model_name,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

- [ ] **Step 3: 创建 document.py**

```python
"""文档处理 API"""
from fastapi import APIRouter
from ..models.schemas import (
    DocumentParseRequest,
    DocumentParseResponse,
    SummaryRequest,
    SummaryResponse,
)
from ..services.document_parser import document_parser
from ..services.summarizer import summarizer

router = APIRouter()


@router.post("/parse", response_model=DocumentParseResponse)
async def parse_document(request: DocumentParseRequest):
    """文档解析"""
    content, page_count = await document_parser.parse(
        request.file_path,
        request.file_type,
    )
    
    # 获取文件名
    from pathlib import Path
    file_name = Path(request.file_path).name
    
    return DocumentParseResponse(
        content=content,
        file_name=file_name,
        page_count=page_count,
    )


@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """生成摘要"""
    summary, provider, model = await summarizer.summarize(
        content=request.content,
        model_provider=request.model_provider,
        max_length=request.max_length,
    )
    
    return SummaryResponse(
        summary=summary,
        model_provider=provider,
        model_name=model,
    )
```

- [ ] **Step 4: 创建 health.py**

```python
"""健康检查 API"""
from fastapi import APIRouter
from ..models.schemas import HealthResponse
from ..services.llm_client import llm_client

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    models = await llm_client.get_available_models()
    
    return HealthResponse(
        status="healthy",
        models_available=models,
    )


@router.get("/models")
async def list_models():
    """列出可用模型"""
    models = await llm_client.get_available_models()
    return {"models": models}
```

- [ ] **Step 5: Commit**

```bash
git add apps/forge-ai-python/src/api/
git commit -m "feat(ai-python): 添加 API 路由（chat、document、health）"
```

---

### Task 11: 创建 FastAPI 主入口

**Files:**
- Create: `apps/forge-ai-python/src/main.py`

- [ ] **Step 1: 创建 main.py**

```python
"""FastAPI 主入口"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import router
from .utils.http_client import http_client
from .config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    await http_client.init()
    yield
    # 关闭时清理
    await http_client.close()


app = FastAPI(
    title="Forge AI Python Service",
    description="AI 服务 - 文档解析与对话推理",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由（内部 API）
app.include_router(router, prefix="/internal")


@app.get("/")
async def root():
    """根路径"""
    return {"service": "forge-ai-python", "version": "0.1.0"}
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-ai-python/src/main.py
git commit -m "feat(ai-python): 添加 FastAPI 主入口"
```

---

### Task 12: 创建测试和 Dockerfile

**Files:**
- Create: `apps/forge-ai-python/tests/test_health.py`
- Create: `apps/forge-ai-python/Dockerfile`
- Create: `apps/forge-ai-python/README.md`

- [ ] **Step 1: 创建 test_health.py**

```python
"""健康检查测试"""
import pytest
from httpx import AsyncClient
from src.main import app


@pytest.mark.asyncio
async def test_health_check():
    """测试健康检查接口"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/internal/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "models_available" in data


@pytest.mark.asyncio
async def test_root():
    """测试根路径"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "forge-ai-python"
```

- [ ] **Step 2: 创建 Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装 uv
RUN pip install uv

# 复制项目文件
COPY pyproject.toml .
COPY src ./src

# 安装依赖
RUN uv pip install --system -e .

# 暴露端口
EXPOSE 8001

# 启动命令
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

- [ ] **Step 3: 创建 README.md**

```markdown
# Forge AI Python Service

AI 服务 - 文档解析与对话推理

## 快速开始

### 安装依赖

```bash
uv sync
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件配置 API Key
```

### 启动服务

```bash
uv run uvicorn src.main:app --port 8001
```

## API 接口

| 路径 | 说明 |
|------|------|
| GET /internal/health | 健康检查 |
| GET /internal/models | 可用模型列表 |
| POST /internal/chat | 对话推理 |
| POST /internal/chat/stream | 流式对话 |
| POST /internal/document/parse | 文档解析 |
| POST /internal/document/summary | 生成摘要 |

## Docker 部署

```bash
docker build -t forge-ai-python .
docker run -p 8001:8001 forge-ai-python
```
```

- [ ] **Step 4: Commit**

```bash
git add apps/forge-ai-python/tests/ apps/forge-ai-python/Dockerfile apps/forge-ai-python/README.md
git commit -m "feat(ai-python): 添加测试、Dockerfile 和 README"
```

---

### Task 13: 验证服务启动

- [ ] **Step 1: 安装依赖**

```bash
cd apps/forge-ai-python
uv sync
```

Expected: 依赖安装成功

- [ ] **Step 2: 创建空的 __init__.py 文件**

```bash
touch apps/forge-ai-python/src/__init__.py
touch apps/forge-ai-python/src/config/__init__.py
touch apps/forge-ai-python/src/api/__init__.py
touch apps/forge-ai-python/src/services/__init__.py
touch apps/forge-ai-python/src/adapters/__init__.py
touch apps/forge-ai-python/src/models/__init__.py
touch apps/forge-ai-python/src/utils/__init__.py
```

- [ ] **Step 3: Commit**

```bash
git add apps/forge-ai-python/src/**/__init__.py
git commit -m "feat(ai-python): 添加 Python 包 __init__.py 文件"
```

- [ ] **Step 4: 验证服务可启动**

```bash
cd apps/forge-ai-python
uv run uvicorn src.main:app --port 8001 &
sleep 5
curl http://localhost:8001/
curl http://localhost:8001/internal/health
```

Expected: 返回正确的 JSON 响应