# Java AI 服务层和控制器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 forge-module-ai 的服务层、控制器、Python 服务客户端，提供完整的 AI API。

**Architecture:** Service 层处理业务逻辑，Controller 提供 REST API，PythonAiClient 调用 Python 服务。

**Tech Stack:** Spring Boot 3.2.0, RestTemplate/WebClient, SSE 支持, MyBatis Plus

**前置依赖:** Plan 1 完成（数据层基础）

---

## 文件结构

### 新建文件

```
apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/
├── dto/
│   ├── request/
│   │   ├── ChatRequest.java
│   │   ├── CreateConversationRequest.java
│   │   ├── DocumentSummaryRequest.java
│   └── response/
│       ├── ChatResponse.java
│       ├── ConversationResponse.java
│       ├── DocumentResponse.java
│       ├── ModelListResponse.java

apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/
├── service/
│   ├── AiChatService.java
│   ├── AiDocumentService.java
│   ├── AiModelService.java
│   ├── impl/
│   │   ├── AiChatServiceImpl.java
│   │   ├── AiDocumentServiceImpl.java
│   │   ├── AiModelServiceImpl.java
├── client/
│   ├── PythonAiClient.java
│   ├── PythonAiClientImpl.java
├── config/
│   ├── AiModuleConfig.java
│   ├── PythonServiceConfig.java
├── controller/
│   ├── AiChatController.java
│   ├── AiDocumentController.java
│   ├── AiModelController.java
```

---

### Task 1: 创建 DTO 类

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/request/ChatRequest.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/request/CreateConversationRequest.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/request/DocumentSummaryRequest.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/response/ChatResponse.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/response/ConversationResponse.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/response/DocumentResponse.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/response/ModelListResponse.java`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/request
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/response
```

- [ ] **Step 2: 创建 ChatRequest.java**

```java
package com.forge.modules.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

/**
 * 对话请求
 */
@Data
public class ChatRequest {

    @NotNull
    private Long conversationId;

    @NotBlank
    private String content;

    private String modelProvider;

    private String modelName;

    private Integer maxTokens;

    private Double temperature;

    private Boolean stream = false;
}
```

- [ ] **Step 3: 创建 CreateConversationRequest.java**

```java
package com.forge.modules.ai.dto.request;

import lombok.Data;

/**
 * 创建会话请求
 */
@Data
public class CreateConversationRequest {

    private String title;

    private String modelProvider;

    private String modelName;

    private String systemPrompt;
}
```

- [ ] **Step 4: 创建 DocumentSummaryRequest.java**

```java
package com.forge.modules.ai.dto.request;

import lombok.Data;

/**
 * 文档摘要请求
 */
@Data
public class DocumentSummaryRequest {

    private String modelProvider;

    private Integer maxLength = 500;
}
```

- [ ] **Step 5: 创建 ChatResponse.java**

```java
package com.forge.modules.ai.dto.response;

import lombok.Data;

/**
 * 对话响应
 */
@Data
public class ChatResponse {

    private Long messageId;

    private String content;

    private String modelProvider;

    private String modelName;

    private Integer tokensUsed;

    private Integer responseTime;
}
```

- [ ] **Step 6: 创建 ConversationResponse.java**

```java
package com.forge.modules.ai.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 会话响应
 */
@Data
public class ConversationResponse {

    private Long id;

    private String title;

    private String modelProvider;

    private String modelName;

    private Integer status;

    private LocalDateTime createTime;

    private List<MessageResponse> messages;

    @Data
    public static class MessageResponse {
        private Long id;
        private String role;
        private String content;
        private LocalDateTime createTime;
    }
}
```

- [ ] **Step 7: 创建 DocumentResponse.java**

```java
package com.forge.modules.ai.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 文档响应
 */
@Data
public class DocumentResponse {

    private Long id;

    private String fileName;

    private String fileType;

    private Long fileSize;

    private String content;

    private String summary;

    private Integer status;

    private String errorMessage;

    private String modelProvider;

    private LocalDateTime createTime;
}
```

- [ ] **Step 8: 创建 ModelListResponse.java**

```java
package com.forge.modules.ai.dto.response;

import lombok.Data;
import java.util.List;

/**
 * 模型列表响应
 */
@Data
public class ModelListResponse {

    private List<ModelConfigResponse> models;

    @Data
    public static class ModelConfigResponse {
        private Long id;
        private String provider;
        private String modelName;
        private Integer isEnabled;
        private Integer isDefault;
        private Integer maxTokens;
        private Double temperature;
    }
}
```

- [ ] **Step 9: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai/forge-module-ai-api
```

- [ ] **Step 10: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/dto/
git commit -m "feat(ai): 添加 AI 模块 DTO 类"
```

---

### Task 2: 创建 Python 服务客户端

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/client/PythonAiClient.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/client/PythonAiClientImpl.java`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/client
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/impl
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/controller
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/config
```

- [ ] **Step 2: 创建 PythonAiClient.java（接口）**

```java
package com.forge.modules.ai.client;

import java.util.List;
import java.util.Map;

/**
 * Python AI 服务客户端接口
 */
public interface PythonAiClient {

    /**
     * 对话推理
     */
    String chat(List<Map<String, String>> messages, String modelProvider, String modelName);

    /**
     * 生成摘要
     */
    String summarize(String content, String modelProvider, Integer maxLength);

    /**
     * 解析文档
     */
    Map<String, Object> parseDocument(String filePath, String fileType);

    /**
     * 获取可用模型列表
     */
    List<String> getAvailableModels();

    /**
     * 健康检查
     */
    boolean healthCheck();
}
```

- [ ] **Step 3: 创建 PythonAiClientImpl.java**

```java
package com.forge.modules.ai.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Python AI 服务客户端实现
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PythonAiClientImpl implements PythonAiClient {

    private final RestTemplate restTemplate;

    // Python 服务地址（从配置读取）
    private String pythonServiceUrl = "http://localhost:8001";

    @Override
    public String chat(List<Map<String, String>> messages, String modelProvider, String modelName) {
        String url = pythonServiceUrl + "/internal/chat";

        Map<String, Object> request = new HashMap<>();
        request.put("messages", messages);
        if (modelProvider != null) {
            request.put("model_provider", modelProvider);
        }
        if (modelName != null) {
            request.put("model_name", modelName);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null) {
                return (String) body.get("content");
            }
            return null;
        } catch (Exception e) {
            log.error("Python AI chat error: {}", e.getMessage());
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    @Override
    public String summarize(String content, String modelProvider, Integer maxLength) {
        String url = pythonServiceUrl + "/internal/document/summary";

        Map<String, Object> request = new HashMap<>();
        request.put("content", content);
        if (modelProvider != null) {
            request.put("model_provider", modelProvider);
        }
        if (maxLength != null) {
            request.put("max_length", maxLength);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null) {
                return (String) body.get("summary");
            }
            return null;
        } catch (Exception e) {
            log.error("Python AI summarize error: {}", e.getMessage());
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> parseDocument(String filePath, String fileType) {
        String url = pythonServiceUrl + "/internal/document/parse";

        Map<String, Object> request = new HashMap<>();
        request.put("file_path", filePath);
        request.put("file_type", fileType);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Python AI parse document error: {}", e.getMessage());
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    @Override
    public List<String> getAvailableModels() {
        String url = pythonServiceUrl + "/internal/models";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null) {
                return (List<String>) body.get("models");
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Python AI get models error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public boolean healthCheck() {
        String url = pythonServiceUrl + "/internal/health";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }

    public void setPythonServiceUrl(String url) {
        this.pythonServiceUrl = url;
    }
}
```

- [ ] **Step 4: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai/forge-module-ai-biz
```

- [ ] **Step 5: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/client/
git commit -m "feat(ai): 添加 Python AI 服务客户端"
```

---

### Task 3: 创建服务接口和实现

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/AiChatService.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/AiDocumentService.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/AiModelService.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/impl/AiChatServiceImpl.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/impl/AiDocumentServiceImpl.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/impl/AiModelServiceImpl.java`

- [ ] **Step 1: 创建 AiChatService.java（接口）**

```java
package com.forge.modules.ai.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.modules.ai.dto.request.ChatRequest;
import com.forge.modules.ai.dto.request.CreateConversationRequest;
import com.forge.modules.ai.dto.response.ChatResponse;
import com.forge.modules.ai.dto.response.ConversationResponse;
import com.forge.modules.ai.entity.AiConversation;

import java.util.List;

/**
 * AI 对话服务接口
 */
public interface AiChatService {

    /**
     * 创建会话
     */
    AiConversation createConversation(Long userId, CreateConversationRequest request);

    /**
     * 获取用户会话列表
     */
    Page<ConversationResponse> getConversations(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 发送消息
     */
    ChatResponse sendMessage(Long userId, ChatRequest request);

    /**
     * 获取会话消息历史
     */
    List<ConversationResponse.MessageResponse> getMessages(Long conversationId);

    /**
     * 删除会话
     */
    void deleteConversation(Long userId, Long conversationId);
}
```

- [ ] **Step 2: 创建 AiDocumentService.java（接口）**

```java
package com.forge.modules.ai.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.modules.ai.dto.response.DocumentResponse;
import com.forge.modules.ai.entity.AiDocument;
import org.springframework.web.multipart.MultipartFile;

/**
 * AI 文档服务接口
 */
public interface AiDocumentService {

    /**
     * 上传文档
     */
    AiDocument uploadDocument(Long userId, MultipartFile file);

    /**
     * 获取文档列表
     */
    Page<DocumentResponse> getDocuments(Long userId, Integer pageNum, Integer pageSize);

    /**
     * 获取文档详情
     */
    DocumentResponse getDocument(Long userId, Long documentId);

    /**
     * 生成摘要
     */
    DocumentResponse generateSummary(Long userId, Long documentId, String modelProvider, Integer maxLength);

    /**
     * 删除文档
     */
    void deleteDocument(Long userId, Long documentId);
}
```

- [ ] **Step 3: 创建 AiModelService.java（接口）**

```java
package com.forge.modules.ai.service;

import com.forge.modules.ai.dto.response.ModelListResponse;
import com.forge.modules.ai.entity.AiModelConfig;

import java.util.List;

/**
 * AI 模型服务接口
 */
public interface AiModelService {

    /**
     * 获取模型列表
     */
    ModelListResponse getModelList();

    /**
     * 配置模型
     */
    AiModelConfig configModel(Long id, String apiKey, Integer maxTokens, Double temperature);

    /**
     * 切换默认模型
     */
    void switchDefaultModel(Long id);

    /**
     * 启用/禁用模型
     */
    void toggleModel(Long id, Boolean enabled);

    /**
     * 获取可用模型提供商
     */
    List<String> getAvailableProviders();
}
```

- [ ] **Step 4: 创建 AiChatServiceImpl.java**

```java
package com.forge.modules.ai.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.modules.ai.dto.request.ChatRequest;
import com.forge.modules.ai.dto.request.CreateConversationRequest;
import com.forge.modules.ai.dto.response.ChatResponse;
import com.forge.modules.ai.dto.response.ConversationResponse;
import com.forge.modules.ai.entity.AiConversation;
import com.forge.modules.ai.entity.AiMessage;
import com.forge.modules.ai.mapper.AiConversationMapper;
import com.forge.modules.ai.mapper.AiMessageMapper;
import com.forge.modules.ai.service.AiChatService;
import com.forge.modules.ai.client.PythonAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * AI 对话服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final AiConversationMapper conversationMapper;
    private final AiMessageMapper messageMapper;
    private final PythonAiClient pythonAiClient;

    @Override
    public AiConversation createConversation(Long userId, CreateConversationRequest request) {
        AiConversation conversation = new AiConversation();
        conversation.setUserId(userId);
        conversation.setTitle(request.getTitle() != null ? request.getTitle() : "新对话");
        conversation.setModelProvider(request.getModelProvider() != null ? request.getModelProvider() : "deepseek");
        conversation.setModelName(request.getModelName() != null ? request.getModelName() : "deepseek-chat");
        conversation.setSystemPrompt(request.getSystemPrompt());
        conversation.setStatus(1);

        conversationMapper.insert(conversation);
        return conversation;
    }

    @Override
    public Page<ConversationResponse> getConversations(Long userId, Integer pageNum, Integer pageSize) {
        Page<AiConversation> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<AiConversation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiConversation::getUserId, userId)
               .orderByDesc(AiConversation::getCreateTime);

        Page<AiConversation> result = conversationMapper.selectPage(page, wrapper);

        // 转换为响应对象
        Page<ConversationResponse> responsePage = new Page<>();
        responsePage.setCurrent(result.getCurrent());
        responsePage.setSize(result.getSize());
        responsePage.setTotal(result.getTotal());

        List<ConversationResponse> records = new ArrayList<>();
        for (AiConversation conv : result.getRecords()) {
            ConversationResponse resp = new ConversationResponse();
            resp.setId(conv.getId());
            resp.setTitle(conv.getTitle());
            resp.setModelProvider(conv.getModelProvider());
            resp.setModelName(conv.getModelName());
            resp.setStatus(conv.getStatus());
            resp.setCreateTime(conv.getCreateTime());
            records.add(resp);
        }
        responsePage.setRecords(records);

        return responsePage;
    }

    @Override
    @Transactional
    public ChatResponse sendMessage(Long userId, ChatRequest request) {
        // 获取会话
        AiConversation conversation = conversationMapper.selectById(request.getConversationId());
        if (conversation == null || !conversation.getUserId().equals(userId)) {
            throw new RuntimeException("会话不存在或无权限");
        }

        // 保存用户消息
        AiMessage userMessage = new AiMessage();
        userMessage.setConversationId(request.getConversationId());
        userMessage.setRole("user");
        userMessage.setContent(request.getContent());
        messageMapper.insert(userMessage);

        // 获取历史消息
        List<AiMessage> history = messageMapper.selectList(
            new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getConversationId, request.getConversationId())
                .orderByAsc(AiMessage::getCreateTime)
        );

        // 构建消息列表
        List<Map<String, String>> messages = new ArrayList<>();
        if (conversation.getSystemPrompt() != null) {
            messages.add(Map.of("role", "system", "content", conversation.getSystemPrompt()));
        }
        for (AiMessage msg : history) {
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        // 调用 Python 服务
        long startTime = System.currentTimeMillis();
        String responseContent = pythonAiClient.chat(
            messages,
            request.getModelProvider(),
            request.getModelName()
        );
        long endTime = System.currentTimeMillis();

        // 保存 AI 响应
        AiMessage aiMessage = new AiMessage();
        aiMessage.setConversationId(request.getConversationId());
        aiMessage.setRole("assistant");
        aiMessage.setContent(responseContent);
        aiMessage.setModelProvider(request.getModelProvider() != null ? request.getModelProvider() : conversation.getModelProvider());
        aiMessage.setResponseTime((int) (endTime - startTime));
        messageMapper.insert(aiMessage);

        // 返回响应
        ChatResponse response = new ChatResponse();
        response.setMessageId(aiMessage.getId());
        response.setContent(responseContent);
        response.setModelProvider(aiMessage.getModelProvider());
        response.setModelName(conversation.getModelName());
        response.setResponseTime(aiMessage.getResponseTime());

        return response;
    }

    @Override
    public List<ConversationResponse.MessageResponse> getMessages(Long conversationId) {
        List<AiMessage> messages = messageMapper.selectList(
            new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getConversationId, conversationId)
                .orderByAsc(AiMessage::getCreateTime)
        );

        List<ConversationResponse.MessageResponse> result = new ArrayList<>();
        for (AiMessage msg : messages) {
            ConversationResponse.MessageResponse resp = new ConversationResponse.MessageResponse();
            resp.setId(msg.getId());
            resp.setRole(msg.getRole());
            resp.setContent(msg.getContent());
            resp.setCreateTime(msg.getCreateTime());
            result.add(resp);
        }

        return result;
    }

    @Override
    public void deleteConversation(Long userId, Long conversationId) {
        AiConversation conversation = conversationMapper.selectById(conversationId);
        if (conversation == null || !conversation.getUserId().equals(userId)) {
            throw new RuntimeException("会话不存在或无权限");
        }

        // 删除消息
        messageMapper.delete(
            new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getConversationId, conversationId)
        );

        // 删除会话
        conversationMapper.deleteById(conversationId);
    }
}
```

- [ ] **Step 5: 创建 AiDocumentServiceImpl.java**

```java
package com.forge.modules.ai.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.modules.ai.dto.response.DocumentResponse;
import com.forge.modules.ai.entity.AiDocument;
import com.forge.modules.ai.mapper.AiDocumentMapper;
import com.forge.modules.ai.service.AiDocumentService;
import com.forge.modules.ai.client.PythonAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * AI 文档服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDocumentServiceImpl implements AiDocumentService {

    private final AiDocumentMapper documentMapper;
    private final PythonAiClient pythonAiClient;

    @Value("${file.upload.path:/tmp/upload}")
    private String uploadPath;

    @Override
    public AiDocument uploadDocument(Long userId, MultipartFile file) {
        // 保存文件
        String fileName = file.getOriginalFilename();
        String fileType = getFileType(fileName);
        String filePath = saveFile(file);

        // 创建文档记录
        AiDocument document = new AiDocument();
        document.setUserId(userId);
        document.setFileName(fileName);
        document.setFilePath(filePath);
        document.setFileType(fileType);
        document.setFileSize(file.getSize());
        document.setStatus(0); // 待处理

        documentMapper.insert(document);

        // 异步处理文档（这里简化为同步）
        try {
            processDocument(document);
        } catch (Exception e) {
            document.setStatus(3); // 失败
            document.setErrorMessage(e.getMessage());
            documentMapper.updateById(document);
        }

        return document;
    }

    private void processDocument(AiDocument document) {
        document.setStatus(1); // 处理中
        documentMapper.updateById(document);

        // 调用 Python 服务解析文档
        Map<String, Object> result = pythonAiClient.parseDocument(
            document.getFilePath(),
            document.getFileType()
        );

        if (result != null) {
            document.setContent((String) result.get("content"));
            document.setStatus(2); // 已完成
        } else {
            document.setStatus(3); // 失败
            document.setErrorMessage("文档解析失败");
        }

        documentMapper.updateById(document);
    }

    @Override
    public Page<DocumentResponse> getDocuments(Long userId, Integer pageNum, Integer pageSize) {
        Page<AiDocument> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<AiDocument> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiDocument::getUserId, userId)
               .orderByDesc(AiDocument::getCreateTime);

        Page<AiDocument> result = documentMapper.selectPage(page, wrapper);

        // 转换响应
        Page<DocumentResponse> responsePage = new Page<>();
        responsePage.setCurrent(result.getCurrent());
        responsePage.setSize(result.getSize());
        responsePage.setTotal(result.getTotal());

        List<DocumentResponse> records = new ArrayList<>();
        for (AiDocument doc : result.getRecords()) {
            records.add(convertToResponse(doc));
        }
        responsePage.setRecords(records);

        return responsePage;
    }

    @Override
    public DocumentResponse getDocument(Long userId, Long documentId) {
        AiDocument document = documentMapper.selectById(documentId);
        if (document == null || !document.getUserId().equals(userId)) {
            throw new RuntimeException("文档不存在或无权限");
        }
        return convertToResponse(document);
    }

    @Override
    public DocumentResponse generateSummary(Long userId, Long documentId, String modelProvider, Integer maxLength) {
        AiDocument document = documentMapper.selectById(documentId);
        if (document == null || !document.getUserId().equals(userId)) {
            throw new RuntimeException("文档不存在或无权限");
        }

        if (document.getContent() == null) {
            throw new RuntimeException("文档内容未解析");
        }

        // 调用 Python 服务生成摘要
        String summary = pythonAiClient.summarize(document.getContent(), modelProvider, maxLength);

        document.setSummary(summary);
        document.setModelProvider(modelProvider);
        documentMapper.updateById(document);

        return convertToResponse(document);
    }

    @Override
    public void deleteDocument(Long userId, Long documentId) {
        AiDocument document = documentMapper.selectById(documentId);
        if (document == null || !document.getUserId().equals(userId)) {
            throw new RuntimeException("文档不存在或无权限");
        }

        // 删除文件
        try {
            Files.deleteIfExists(Paths.get(document.getFilePath()));
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", document.getFilePath());
        }

        // 删除记录
        documentMapper.deleteById(documentId);
    }

    private DocumentResponse convertToResponse(AiDocument document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setFileName(document.getFileName());
        response.setFileType(document.getFileType());
        response.setFileSize(document.getFileSize());
        response.setContent(document.getContent());
        response.setSummary(document.getSummary());
        response.setStatus(document.getStatus());
        response.setErrorMessage(document.getErrorMessage());
        response.setModelProvider(document.getModelProvider());
        response.setCreateTime(document.getCreateTime());
        return response;
    }

    private String getFileType(String fileName) {
        if (fileName == null) return "unknown";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            return fileName.substring(dotIndex + 1).toLowerCase();
        }
        return "unknown";
    }

    private String saveFile(MultipartFile file) {
        try {
            Path uploadDir = Paths.get(uploadPath, "ai-documents");
            Files.createDirectories(uploadDir);

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadDir.resolve(fileName);
            file.transferTo(filePath.toFile());

            return filePath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }
}
```

- [ ] **Step 6: 创建 AiModelServiceImpl.java**

```java
package com.forge.modules.ai.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.forge.modules.ai.dto.response.ModelListResponse;
import com.forge.modules.ai.entity.AiModelConfig;
import com.forge.modules.ai.mapper.AiModelConfigMapper;
import com.forge.modules.ai.service.AiModelService;
import com.forge.modules.ai.client.PythonAiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * AI 模型服务实现
 */
@Service
@RequiredArgsConstructor
public class AiModelServiceImpl implements AiModelService {

    private final AiModelConfigMapper modelConfigMapper;
    private final PythonAiClient pythonAiClient;

    @Override
    public ModelListResponse getModelList() {
        List<AiModelConfig> configs = modelConfigMapper.selectList(
            new LambdaQueryWrapper<AiModelConfig>()
                .orderByAsc(AiModelConfig::getSortOrder)
        );

        ModelListResponse response = new ModelListResponse();
        List<ModelListResponse.ModelConfigResponse> models = new ArrayList<>();

        for (AiModelConfig config : configs) {
            ModelListResponse.ModelConfigResponse model = new ModelListResponse.ModelConfigResponse();
            model.setId(config.getId());
            model.setProvider(config.getProvider());
            model.setModelName(config.getModelName());
            model.setIsEnabled(config.getIsEnabled());
            model.setIsDefault(config.getIsDefault());
            model.setMaxTokens(config.getMaxTokens());
            model.setTemperature(config.getTemperature());
            models.add(model);
        }

        response.setModels(models);
        return response;
    }

    @Override
    public AiModelConfig configModel(Long id, String apiKey, Integer maxTokens, Double temperature) {
        AiModelConfig config = modelConfigMapper.selectById(id);
        if (config == null) {
            throw new RuntimeException("模型配置不存在");
        }

        if (apiKey != null) {
            config.setApiKey(apiKey); // 实际应用中需要加密
        }
        if (maxTokens != null) {
            config.setMaxTokens(maxTokens);
        }
        if (temperature != null) {
            config.setTemperature(temperature);
        }

        modelConfigMapper.updateById(config);
        return config;
    }

    @Override
    @Transactional
    public void switchDefaultModel(Long id) {
        AiModelConfig config = modelConfigMapper.selectById(id);
        if (config == null) {
            throw new RuntimeException("模型配置不存在");
        }

        // 清除所有默认
        modelConfigMapper.update(null,
            new LambdaUpdateWrapper<AiModelConfig>()
                .set(AiModelConfig::getIsDefault, 0)
        );

        // 设置新默认
        config.setIsDefault(1);
        modelConfigMapper.updateById(config);
    }

    @Override
    public void toggleModel(Long id, Boolean enabled) {
        AiModelConfig config = modelConfigMapper.selectById(id);
        if (config == null) {
            throw new RuntimeException("模型配置不存在");
        }

        config.setIsEnabled(enabled ? 1 : 0);
        modelConfigMapper.updateById(config);
    }

    @Override
    public List<String> getAvailableProviders() {
        return pythonAiClient.getAvailableModels();
    }
}
```

- [ ] **Step 7: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai
```

- [ ] **Step 8: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/service/
git commit -m "feat(ai): 添加 AI 模块服务层实现"
```

---

### Task 4: 创建 Controller

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/controller/AiChatController.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/controller/AiDocumentController.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/controller/AiModelController.java`

- [ ] **Step 1: 创建 AiChatController.java**

```java
package com.forge.modules.ai.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.common.response.PageResult;
import com.forge.common.response.Result;
import com.forge.modules.ai.dto.request.ChatRequest;
import com.forge.modules.ai.dto.request.CreateConversationRequest;
import com.forge.modules.ai.dto.response.ChatResponse;
import com.forge.modules.ai.dto.response.ConversationResponse;
import com.forge.modules.ai.entity.AiConversation;
import com.forge.modules.ai.service.AiChatService;
import com.forge.framework.security.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 对话控制器
 */
@Tag(name = "AI对话管理")
@RestController
@RequestMapping("/ai/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @Operation(summary = "创建会话")
    @PostMapping("/conversations")
    @PreAuthorize("hasAuthority('ai:chat:create')")
    public Result<AiConversation> createConversation(@Valid @RequestBody CreateConversationRequest request) {
        Long userId = SecurityUtils.getUserId();
        AiConversation conversation = aiChatService.createConversation(userId, request);
        return Result.success(conversation);
    }

    @Operation(summary = "会话列表")
    @GetMapping("/conversations")
    @PreAuthorize("hasAuthority('ai:chat:query')")
    public Result<PageResult<ConversationResponse>> getConversations(
        @RequestParam(defaultValue = "1") Integer pageNum,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        Long userId = SecurityUtils.getUserId();
        Page<ConversationResponse> page = aiChatService.getConversations(userId, pageNum, pageSize);
        return Result.success(PageResult.of(page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize()));
    }

    @Operation(summary = "发送消息")
    @PostMapping("/send")
    @PreAuthorize("hasAuthority('ai:chat:create')")
    public Result<ChatResponse> sendMessage(@Valid @RequestBody ChatRequest request) {
        Long userId = SecurityUtils.getUserId();
        ChatResponse response = aiChatService.sendMessage(userId, request);
        return Result.success(response);
    }

    @Operation(summary = "消息历史")
    @GetMapping("/conversations/{id}/messages")
    @PreAuthorize("hasAuthority('ai:chat:query')")
    public Result<List<ConversationResponse.MessageResponse>> getMessages(@PathVariable Long id) {
        List<ConversationResponse.MessageResponse> messages = aiChatService.getMessages(id);
        return Result.success(messages);
    }

    @Operation(summary = "删除会话")
    @DeleteMapping("/conversations/{id}")
    @PreAuthorize("hasAuthority('ai:chat:delete')")
    public Result<Void> deleteConversation(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        aiChatService.deleteConversation(userId, id);
        return Result.success();
    }
}
```

- [ ] **Step 2: 创建 AiDocumentController.java**

```java
package com.forge.modules.ai.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.forge.common.response.PageResult;
import com.forge.common.response.Result;
import com.forge.modules.ai.dto.request.DocumentSummaryRequest;
import com.forge.modules.ai.dto.response.DocumentResponse;
import com.forge.modules.ai.entity.AiDocument;
import com.forge.modules.ai.service.AiDocumentService;
import com.forge.framework.security.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * AI 文档控制器
 */
@Tag(name = "AI文档管理")
@RestController
@RequestMapping("/ai/document")
@RequiredArgsConstructor
public class AiDocumentController {

    private final AiDocumentService aiDocumentService;

    @Operation(summary = "上传文档")
    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('ai:document:upload')")
    public Result<AiDocument> uploadDocument(@RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtils.getUserId();
        AiDocument document = aiDocumentService.uploadDocument(userId, file);
        return Result.success(document);
    }

    @Operation(summary = "文档列表")
    @GetMapping("/list")
    @PreAuthorize("hasAuthority('ai:document:query')")
    public Result<PageResult<DocumentResponse>> getDocuments(
        @RequestParam(defaultValue = "1") Integer pageNum,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        Long userId = SecurityUtils.getUserId();
        Page<DocumentResponse> page = aiDocumentService.getDocuments(userId, pageNum, pageSize);
        return Result.success(PageResult.of(page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize()));
    }

    @Operation(summary = "文档详情")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ai:document:query')")
    public Result<DocumentResponse> getDocument(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        DocumentResponse document = aiDocumentService.getDocument(userId, id);
        return Result.success(document);
    }

    @Operation(summary = "生成摘要")
    @PostMapping("/{id}/summary")
    @PreAuthorize("hasAuthority('ai:document:summary')")
    public Result<DocumentResponse> generateSummary(
        @PathVariable Long id,
        @RequestBody DocumentSummaryRequest request
    ) {
        Long userId = SecurityUtils.getUserId();
        DocumentResponse document = aiDocumentService.generateSummary(
            userId, id, request.getModelProvider(), request.getMaxLength()
        );
        return Result.success(document);
    }

    @Operation(summary = "删除文档")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ai:document:delete')")
    public Result<Void> deleteDocument(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        aiDocumentService.deleteDocument(userId, id);
        return Result.success();
    }
}
```

- [ ] **Step 3: 创建 AiModelController.java**

```java
package com.forge.modules.ai.controller;

import com.forge.common.response.Result;
import com.forge.modules.ai.dto.response.ModelListResponse;
import com.forge.modules.ai.entity.AiModelConfig;
import com.forge.modules.ai.service.AiModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AI 模型配置控制器
 */
@Tag(name = "AI模型配置")
@RestController
@RequestMapping("/ai/model")
@RequiredArgsConstructor
public class AiModelController {

    private final AiModelService aiModelService;

    @Operation(summary = "模型列表")
    @GetMapping("/list")
    @PreAuthorize("hasAuthority('ai:model:query')")
    public Result<ModelListResponse> getModelList() {
        return Result.success(aiModelService.getModelList());
    }

    @Operation(summary = "可用模型提供商")
    @GetMapping("/available")
    public Result<List<String>> getAvailableProviders() {
        return Result.success(aiModelService.getAvailableProviders());
    }

    @Operation(summary = "配置模型")
    @PutMapping("/{id}/config")
    @PreAuthorize("hasAuthority('ai:model:config')")
    public Result<AiModelConfig> configModel(
        @PathVariable Long id,
        @RequestBody Map<String, Object> request
    ) {
        String apiKey = (String) request.get("apiKey");
        Integer maxTokens = (Integer) request.get("maxTokens");
        Double temperature = (Double) request.get("temperature");

        AiModelConfig config = aiModelService.configModel(id, apiKey, maxTokens, temperature);
        return Result.success(config);
    }

    @Operation(summary = "切换默认模型")
    @PostMapping("/{id}/switch")
    @PreAuthorize("hasAuthority('ai:model:switch')")
    public Result<Void> switchDefaultModel(@PathVariable Long id) {
        aiModelService.switchDefaultModel(id);
        return Result.success();
    }

    @Operation(summary = "启用/禁用模型")
    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasAuthority('ai:model:config')")
    public Result<Void> toggleModel(
        @PathVariable Long id,
        @RequestParam Boolean enabled
    ) {
        aiModelService.toggleModel(id, enabled);
        return Result.success();
    }
}
```

- [ ] **Step 4: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai
```

- [ ] **Step 5: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/controller/
git commit -m "feat(ai): 添加 AI 模块控制器"
```

---

### Task 5: 创建配置类

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/config/AiModuleConfig.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/config/PythonServiceConfig.java`

- [ ] **Step 1: 创建 AiModuleConfig.java**

```java
package com.forge.modules.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

/**
 * AI 模块配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "ai")
public class AiModuleConfig {

    private PythonService pythonService = new PythonService();

    private Models models = new Models();

    @Data
    public static class PythonService {
        private String url = "http://localhost:8001";
        private Integer timeout = 30000;
        private Retry retry = new Retry();

        @Data
        public static class Retry {
            private Integer maxAttempts = 3;
            private Integer backoff = 1000;
        }
    }

    @Data
    public static class Models {
        private String defaultProvider = "deepseek";
    }
}
```

- [ ] **Step 2: 创建 PythonServiceConfig.java**

```java
package com.forge.modules.ai.config;

import com.forge.modules.ai.client.PythonAiClientImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Python 服务配置
 */
@Configuration
@RequiredArgsConstructor
public class PythonServiceConfig {

    private final AiModuleConfig aiModuleConfig;

    // 配置 RestTemplate Bean（如果项目中没有）
    // 这里假设已有，仅设置 URL

    public void configurePythonClient(PythonAiClientImpl client) {
        client.setPythonServiceUrl(aiModuleConfig.getPythonService().getUrl());
    }
}
```

- [ ] **Step 3: 添加 application.yml 配置片段**

在 `apps/forge-server/forge-server/src/main/resources/application.yml` 添加：

```yaml
# AI 模块配置
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

- [ ] **Step 4: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai,forge-server
```

- [ ] **Step 5: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/config/
git add apps/forge-server/forge-server/src/main/resources/application.yml
git commit -m "feat(ai): 添加 AI 模块配置类和 application.yml 配置"
```

---

### Task 6: 全量编译验证

- [ ] **Step 1: 编译整个项目**

```bash
cd apps/forge-server
mvn clean compile
```

Expected: BUILD SUCCESS

- [ ] **Step 2: 最终 Commit**

```bash
git status
git add -A
git commit -m "feat(ai): 完成 AI 模块服务层和控制器"
```