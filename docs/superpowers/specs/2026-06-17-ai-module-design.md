# AI 模块设计文档

## 概述

为 forge-admin 系统新增 AI 模块，提供智能客服问答和文档智能处理能力。采用 Java + Python 分层服务架构，集成国产大模型组合（通义千问、文心一言、DeepSeek、智谱 GLM-4）。

## 业务场景

### 1. 智能客服/问答系统

- 用户提问，AI 回答常见问题
- 多轮对话，上下文记忆
- 会话管理，历史记录

### 2. 文档智能处理

- PDF/Word 文档解析，文本提取
- AI 自动生成摘要
- 文档上传、管理、删除

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Vue 3)                       │
│  ┌───────────────┐  ┌───────────────┐               │
│  │ AI 对话界面   │  │ 文档管理中心  │               │
│  └───────────────┘  └───────────────┘               │
└─────────────────────────────────────────────────────┘
                          ↓ REST API
┌─────────────────────────────────────────────────────┐
│                Java (Spring AI + Spring Boot)        │
│  forge-module-ai                                     │
│  ├─ controller/    AI API 端点                       │
│  ├─ service/       对话管理、路由分发                │
│  ├─ model/         多模型适配层（统一接口）          │
│  ├─ client/        Python 服务 HTTP 客户端          │
│  ├─ mapper/        数据访问                          │
│  └─ config/        配置管理                          │
│  端口: 8181                                         │
└─────────────────────────────────────────────────────┘
                          ↓ REST API (内部调用)
┌─────────────────────────────────────────────────────┐
│               Python (FastAPI + uv)                  │
│  ├─ api/           FastAPI 路由                      │
│  ├─ services/      文档解析、LLM调用、摘要生成       │
│  ├─ adapters/      各模型适配器                      │
│  └─ config/        配置管理                          │
│  端口: 8001                                         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│            国产大模型 API (多模型组合)              │
│  通义千问 │ 文心一言 │ DeepSeek │ 智谱 GLM-4       │
└─────────────────────────────────────────────────────┘
```

## 职责分工

| 层级 | 职责 |
|------|------|
| **Java** | 用户认证、权限控制、会话管理、对话路由、数据持久化、审计日志、多模型适配层入口 |
| **Python** | 文档解析（PDF/Word）、LLM 调用、摘要生成、向量处理、复杂推理 |
| **大模型 API** | 文本生成、摘要生成、对话推理 |

## Java 模块结构

```
apps/forge-server/forge-module-ai/
├── forge-module-ai-api/
│   └── src/main/java/com/forge/modules/ai/
│       ├── entity/
│       │   ├── AiConversation.java
│       │   ├── AiMessage.java
│       │   ├── AiDocument.java
│       │   └── AiModelConfig.java
│       ├── dto/
│       │   ├── request/
│       │   │   ├── ChatRequest.java
│       │   │   ├── DocumentUploadRequest.java
│       │   │   ├── DocumentSummaryRequest.java
│       │   │   └── ModelConfigRequest.java
│       │   └── response/
│       │   │   ├── ChatResponse.java
│       │   │   ├── ConversationResponse.java
│       │   │   ├── DocumentResponse.java
│       │   │   ├── DocumentSummaryResponse.java
│       │   │   ├── ModelListResponse.java
│       │   └── enums/
│           ├── ModelProvider.java    # QWEN/ERNIE/DEEPSEEK/GLM
│           ├── MessageRole.java      # USER/ASSISTANT/SYSTEM
│           └── DocumentStatus.java   # PENDING/PROCESSING/COMPLETED/FAILED
│
├── forge-module-ai-biz/
│   └── src/main/java/com/forge/modules/ai/
│       ├── controller/
│       │   ├── AiChatController.java
│       │   ├── AiDocumentController.java
│       │   ├── AiModelController.java
│       ├── service/
│       │   ├── AiChatService.java
│       │   ├── AiDocumentService.java
│       │   ├── AiModelService.java
│       │   ├── impl/
│       │   │   ├── AiChatServiceImpl.java
│       │   │   ├── AiDocumentServiceImpl.java
│       │   │   ├── AiModelServiceImpl.java
│       │   ├── model/
│       │   │   ├── ModelAdapter.java          # 接口
│       │   │   ├── ModelAdapterFactory.java
│       │   │   ├── QwenAdapter.java
│       │   │   ├── ErnieAdapter.java
│       │   │   ├── DeepSeekAdapter.java
│       │   │   ├── GlmAdapter.java
│       │   ├── client/
│       │   │   ├── PythonAiClient.java        # HTTP 客户端
│       │   ├── mapper/
│       │   │   ├── AiConversationMapper.java
│       │   │   ├── AiMessageMapper.java
│       │   │   ├── AiDocumentMapper.java
│       │   │   ├── AiModelConfigMapper.java
│       │   └── config/
│           ├── AiModuleConfig.java
│           ├── PythonServiceConfig.java
```

## Python 服务结构

```
apps/forge-ai-python/
├── pyproject.toml
├── uv.lock
├── .env
├── src/
│   ├── main.py                        # FastAPI 入口
│   ├── config/
│   │   ├── settings.py                # Pydantic Settings
│   │   └── model_config.py
│   ├── api/
│   │   ├── router.py                  # 路由注册
│   │   ├── chat.py                    # /internal/chat
│   │   ├── document.py                # /internal/document
│   │   ├── embedding.py               # /internal/embedding
│   │   └── health.py                  # /internal/health
│   ├── services/
│   │   ├── document_parser.py         # PDF/Word 解析
│   │   ├── llm_client.py              # 大模型调用
│   │   ├── summarizer.py              # 摘要生成
│   ├── adapters/
│   │   ├── base.py                    # BaseModelAdapter
│   │   ├── qwen.py
│   │   ├── ernie.py
│   │   ├── deepseek.py
│   │   ├── glm.py
│   ├── models/
│   │   └── schemas.py                 # Pydantic 数据模型
│   └── utils/
│       ├── http_client.py
│       └── crypto.py
├── tests/
│   ├── test_api.py
│   └── test_parser.py
└── Dockerfile
```

## 数据库设计

### ai_conversation（对话会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| user_id | bigint | 用户ID |
| title | varchar(100) | 会话标题 |
| model_provider | varchar(20) | 模型提供商 |
| model_name | varchar(50) | 模型名称 |
| system_prompt | text | 系统提示词 |
| status | tinyint | 0:结束 1:进行中 |
| create_time | datetime | 创建时间 |
| update_time | datetime | 更新时间 |
| deleted | tinyint | 删除标记 |

### ai_message（消息记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| conversation_id | bigint | 会话ID |
| role | varchar(10) | user/assistant/system |
| content | text | 消息内容 |
| tokens_used | int | 消耗token数 |
| model_provider | varchar(20) | 实际使用模型 |
| response_time | int | 响应时间(ms) |
| create_time | datetime | 创建时间 |

### ai_document（文档表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| user_id | bigint | 上传用户ID |
| file_name | varchar(255) | 文件名 |
| file_path | varchar(500) | 文件路径 |
| file_type | varchar(20) | pdf/docx/txt |
| file_size | bigint | 文件大小 |
| content | longtext | 提取的文本 |
| summary | text | AI摘要 |
| status | tinyint | 0:待处理 1:处理中 2:完成 3:失败 |
| error_message | varchar(500) | 错误信息 |
| model_provider | varchar(20) | 生成摘要的模型 |
| create_time | datetime | 创建时间 |
| update_time | datetime | 更新时间 |
| deleted | tinyint | 删除标记 |

### ai_model_config（模型配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| provider | varchar(20) | 提供商 |
| model_name | varchar(50) | 模型名称 |
| api_key | varchar(200) | API密钥(加密) |
| api_url | varchar(200) | API地址 |
| max_tokens | int | 最大token数 |
| temperature | decimal(3,2) | 温度参数 |
| is_enabled | tinyint | 是否启用 |
| is_default | tinyint | 是否默认 |
| sort_order | int | 排序 |
| remark | varchar(255) | 备注 |
| create_time | datetime | 创建时间 |
| update_time | datetime | 更新时间 |
| deleted | tinyint | 删除标记 |

## API 设计

### Java API（对外）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ai/chat/conversations | 创建会话 |
| GET | /api/ai/chat/conversations | 会话列表 |
| DELETE | /api/ai/chat/conversations/{id} | 删除会话 |
| POST | /api/ai/chat/send | 发送消息(SSE流式) |
| GET | /api/ai/chat/conversations/{id}/messages | 消息历史 |
| POST | /api/ai/document/upload | 上传文档 |
| GET | /api/ai/document/list | 文档列表 |
| POST | /api/ai/document/{id}/summary | 生成摘要 |
| GET | /api/ai/document/{id} | 文档详情 |
| DELETE | /api/ai/document/{id} | 删除文档 |
| GET | /api/ai/model/list | 可用模型列表 |
| PUT | /api/ai/model/{id}/config | 配置模型 |
| POST | /api/ai/model/{id}/switch | 切换默认模型 |

### Python API（内部）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /internal/chat | 对话推理 |
| POST | /internal/chat/stream | 流式对话 |
| POST | /internal/document/parse | 文档解析 |
| POST | /internal/document/summary | 生成摘要 |
| POST | /internal/embedding | 文本向量化 |
| GET | /internal/models/available | 可用模型状态 |
| GET | /internal/health | 健康检查 |

## 多模型适配层

### Java 适配器接口

```java
public interface ModelAdapter {
    String chat(String systemPrompt, String userMessage, ChatOptions options);
    Flux<String> chatStream(String systemPrompt, String userMessage, ChatOptions options);
    String summarize(String content, SummarizeOptions options);
    ModelProvider getProvider();
    boolean isAvailable();
}
```

### Python 适配器接口

```python
class BaseModelAdapter(ABC):
    @abstractmethod
    async def chat(self, messages: list, **options) -> str
    
    @abstractmethod
    async def chat_stream(self, messages: list, **options) -> AsyncIterator[str]
    
    @abstractmethod
    async def summarize(self, content: str) -> str
```

### 支持的模型提供商

| Provider | 模型 | API 地址 |
|----------|------|----------|
| QWEN | qwen-turbo, qwen-plus, qwen-max | https://dashscope.aliyuncs.com/api/v1 |
| ERNIE | ernie-bot-4, ernie-bot-turbo | https://aip.baidubce.com/rpc/2.0 |
| DEEPSEEK | deepseek-chat, deepseek-coder | https://api.deepseek.com/v1 |
| GLM | glm-4, glm-4-flash | https://open.bigmodel.cn/api/paas/v4 |

## 前端页面

### /views/ai/chat/index.vue（智能对话）

- 左侧：会话列表 + 新建会话 + 模型选择
- 右侧：消息气泡 + 输入框 + 发送按钮
- 流式响应 SSE 显示
- 会话标题自动生成

### /views/ai/document/index.vue（文档管理）

- 上传区域：拖拽上传，支持 PDF/Word/TXT
- 文档列表：文件名、类型、状态、操作
- 详情弹窗：原文 + AI 摘要

### /views/ai/model/index.vue（模型配置）

- 模型列表表格
- API Key 配置（加密显示）
- 参数配置（温度、max_tokens）
- 启用/禁用、设置默认

## 配置

### Java application.yml

```yaml
ai:
  python-service:
    url: http://localhost:8001
    timeout: 30000
    retry:
      max-attempts: 3
      backoff: 1000
  models:
    default-provider: deepseek
```

### Python pyproject.toml

```toml
[project]
name = "forge-ai-python"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn>=0.27.0",
    "httpx>=0.27.0",
    "pypdf>=4.0.0",
    "python-docx>=1.1.0",
    "pydantic>=2.0.0",
]
```

### 环境变量

```bash
QWEN_API_KEY=sk-xxx
ERNIE_API_KEY=xxx
DEEPSEEK_API_KEY=sk-xxx
GLM_API_KEY=xxx
DEFAULT_MODEL_PROVIDER=deepseek
```

## 部署

### 开发阶段

```bash
# Python
cd apps/forge-ai-python
uv sync
uv run uvicorn src.main:app --port 8001

# Java
cd apps/forge-server
mvn spring-boot:run -pl forge-server

# 前端
cd apps/forge-web
pnpm dev
```

### 生产阶段

```yaml
services:
  forge-server:
    build: ./apps/forge-server
    ports: ["8181:8181"]
    
  forge-ai-python:
    build: ./apps/forge-ai-python
    ports: ["8001:8001"]
    
  forge-web:
    build: ./apps/forge-web
    ports: ["80:80"]
```

## 安全设计

### API Key 安全

- 数据库 AES-256 加密存储
- 环境变量配置，不硬编码
- 前端不暴露，仅管理员可配置

### 访问控制

| 功能 | 权限标识 |
|------|----------|
| 对话创建 | ai:chat:create |
| 对话查询 | ai:chat:query |
| 对话删除 | ai:chat:delete |
| 文档上传 | ai:document:upload |
| 文档摘要 | ai:document:summary |
| 文档删除 | ai:document:delete |
| 模型配置 | ai:model:config |
| 模型切换 | ai:model:switch |

### 审计日志

- 所有 AI 交互记录（请求/响应/tokens）
- 文档处理操作记录
- 模型配置变更记录

## 错误处理

### 错误码

| 错误码 | 说明 |
|--------|------|
| MODEL_NOT_AVAILABLE | 模型不可用 |
| MODEL_RATE_LIMITED | 模型限流 |
| PYTHON_SERVICE_ERROR | Python 服务错误 |
| DOCUMENT_PARSE_FAILED | 文档解析失败 |
| API_KEY_INVALID | API Key 无效 |

### 降级策略

1. 模型调用失败 → 自动切换备用模型
2. 所有模型不可用 → 返回友好提示
3. Python 服务不可用 → Java 直接调用简单模型

## 依赖关系

```
forge-module-ai-biz ← forge-module-ai-api, forge-framework, Python Service
forge-server ← forge-module-ai-biz
```

## 迁移脚本

`V2026061701__ai_module_tables.sql` - 创建 AI 模块数据表

## 菜单数据

| ID | 菜单名 | 父ID | 路径 |
|----|--------|------|------|
| 300 | AI 智能助手 | 0 | /ai |
| 301 | 智能对话 | 300 | /ai/chat |
| 302 | 文档管理 | 300 | /ai/document |
| 310 | 模型配置 | 300 | /ai/model |