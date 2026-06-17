# AI 模块基础（Java 数据层）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 forge-module-ai 模块的数据层基础，包括实体类、Mapper 接口、数据库表结构和菜单数据。

**Architecture:** 遵循现有项目模块分层模式（api/biz），使用 MyBatis Plus 进行数据访问，数据库表按设计文档定义。

**Tech Stack:** Spring Boot 3.2.0, MyBatis Plus 3.5.7, MySQL 8.0, Lombok

---

## 文件结构

### 新建文件

```
apps/forge-server/forge-module-ai/
├── pom.xml
├── forge-module-ai-api/
│   ├── pom.xml
│   └── src/main/java/com/forge/modules/ai/
│       ├── entity/
│       │   ├── AiConversation.java
│       │   ├── AiMessage.java
│       │   ├── AiDocument.java
│       │   └── AiModelConfig.java
│       └── enums/
│           ├── ModelProvider.java
│           ├── MessageRole.java
│           └── DocumentStatus.java
├── forge-module-ai-biz/
│   ├── pom.xml
│   └── src/main/java/com/forge/modules/ai/
│       ├── mapper/
│       │   ├── AiConversationMapper.java
│       │   ├── AiMessageMapper.java
│       │   ├── AiDocumentMapper.java
│       │   └── AiModelConfigMapper.java

apps/forge-server/forge-server/src/main/resources/db/migration/
└── V2026061701__ai_module_tables.sql

apps/forge-server/forge-dependencies/pom.xml (修改)
apps/forge-server/pom.xml (修改)
apps/forge-server/forge-server/pom.xml (修改)
```

---

### Task 1: 创建模块目录和 pom.xml 配置

**Files:**
- Create: `apps/forge-server/forge-module-ai/pom.xml`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/pom.xml`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/pom.xml`
- Modify: `apps/forge-server/pom.xml` (添加模块)
- Modify: `apps/forge-server/forge-dependencies/pom.xml` (添加依赖声明)

- [ ] **Step 1: 创建 forge-module-ai 聚合 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.forge</groupId>
        <artifactId>forge</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>forge-module-ai</artifactId>
    <packaging>pom</packaging>
    <name>forge-module-ai</name>
    <description>AI 模块 - 智能对话与文档处理</description>

    <modules>
        <module>forge-module-ai-api</module>
        <module>forge-module-ai-biz</module>
    </modules>
</project>
```

- [ ] **Step 2: 创建 forge-module-ai-api pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.forge</groupId>
        <artifactId>forge-module-ai</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>forge-module-ai-api</artifactId>
    <name>forge-module-ai-api</name>
    <description>AI 模块 API - 实体与 DTO</description>

    <dependencies>
        <dependency>
            <groupId>com.forge</groupId>
            <artifactId>forge-common</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-annotation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 3: 创建 forge-module-ai-biz pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.forge</groupId>
        <artifactId>forge-module-ai</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>forge-module-ai-biz</artifactId>
    <name>forge-module-ai-biz</name>
    <description>AI 模块业务层</description>

    <dependencies>
        <dependency>
            <groupId>com.forge</groupId>
            <artifactId>forge-module-ai-api</artifactId>
        </dependency>
        <dependency>
            <groupId>com.forge</groupId>
            <artifactId>forge-spring-boot-starter-mybatis</artifactId>
        </dependency>
        <dependency>
            <groupId>com.forge</groupId>
            <artifactId>forge-spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 4: 创建目录结构**

```bash
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/entity
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/enums
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/mapper
mkdir -p apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/resources/mapper
```

- [ ] **Step 5: 修改根 pom.xml 添加模块**

在 `apps/forge-server/pom.xml` 的 `<modules>` 中添加：

```xml
<module>forge-module-ai</module>
```

- [ ] **Step 6: 修改 forge-dependencies/pom.xml 添加依赖声明**

在 `<dependencies>` 中添加：

```xml
<!-- AI 模块 -->
<dependency>
    <groupId>com.forge</groupId>
    <artifactId>forge-module-ai-api</artifactId>
    <version>${project.version}</version>
</dependency>
<dependency>
    <groupId>com.forge</groupId>
    <artifactId>forge-module-ai-biz</artifactId>
    <version>${project.version}</version>
</dependency>
```

- [ ] **Step 7: 修改 forge-server/pom.xml 添加依赖**

在 `apps/forge-server/forge-server/pom.xml` 的 `<dependencies>` 中添加：

```xml
<dependency>
    <groupId>com.forge</groupId>
    <artifactId>forge-module-ai-biz</artifactId>
</dependency>
```

- [ ] **Step 8: 编译验证**

```bash
cd apps/forge-server
mvn clean compile -pl forge-module-ai
```

Expected: BUILD SUCCESS

- [ ] **Step 9: Commit**

```bash
git add apps/forge-server/forge-module-ai/
git add apps/forge-server/pom.xml
git add apps/forge-server/forge-dependencies/pom.xml
git add apps/forge-server/forge-server/pom.xml
git commit -m "feat(ai): 创建 forge-module-ai 模块结构和 pom 配置"
```

---

### Task 2: 创建枚举类

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/enums/ModelProvider.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/enums/MessageRole.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/enums/DocumentStatus.java`

- [ ] **Step 1: 创建 ModelProvider 枚举**

```java
package com.forge.modules.ai.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * AI 模型提供商枚举
 */
@Getter
@AllArgsConstructor
public enum ModelProvider {

    QWEN("qwen", "通义千问"),
    ERNIE("ernie", "文心一言"),
    DEEPSEEK("deepseek", "DeepSeek"),
    GLM("glm", "智谱GLM");

    private final String code;
    private final String name;
}
```

- [ ] **Step 2: 创建 MessageRole 枚举**

```java
package com.forge.modules.ai.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 消息角色枚举
 */
@Getter
@AllArgsConstructor
public enum MessageRole {

    USER("user", "用户"),
    ASSISTANT("assistant", "助手"),
    SYSTEM("system", "系统");

    private final String code;
    private final String name;
}
```

- [ ] **Step 3: 创建 DocumentStatus 枚举**

```java
package com.forge.modules.ai.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 文档处理状态枚举
 */
@Getter
@AllArgsConstructor
public enum DocumentStatus {

    PENDING(0, "待处理"),
    PROCESSING(1, "处理中"),
    COMPLETED(2, "已完成"),
    FAILED(3, "失败");

    private final Integer code;
    private final String name;
}
```

- [ ] **Step 4: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai/forge-module-ai-api
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/enums/
git commit -m "feat(ai): 添加 AI 模块枚举类（ModelProvider、MessageRole、DocumentStatus）"
```

---

### Task 3: 创建实体类

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/entity/AiConversation.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/entity/AiMessage.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/entity/AiDocument.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/entity/AiModelConfig.java`

- [ ] **Step 1: 创建 AiConversation 实体**

```java
package com.forge.modules.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.forge.modules.ai.enums.ModelProvider;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * AI 对话会话实体
 */
@Data
@TableName("ai_conversation")
public class AiConversation {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String title;

    private String modelProvider;

    private String modelName;

    private String systemPrompt;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
```

- [ ] **Step 2: 创建 AiMessage 实体**

```java
package com.forge.modules.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * AI 消息记录实体
 */
@Data
@TableName("ai_message")
public class AiMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long conversationId;

    private String role;

    private String content;

    private Integer tokensUsed;

    private String modelProvider;

    private Integer responseTime;

    private LocalDateTime createTime;
}
```

- [ ] **Step 3: 创建 AiDocument 实体**

```java
package com.forge.modules.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * AI 文档实体
 */
@Data
@TableName("ai_document")
public class AiDocument {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String fileName;

    private String filePath;

    private String fileType;

    private Long fileSize;

    private String content;

    private String summary;

    private Integer status;

    private String errorMessage;

    private String modelProvider;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
```

- [ ] **Step 4: 创建 AiModelConfig 实体**

```java
package com.forge.modules.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AI 模型配置实体
 */
@Data
@TableName("ai_model_config")
public class AiModelConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String provider;

    private String modelName;

    private String apiKey;

    private String apiUrl;

    private Integer maxTokens;

    private BigDecimal temperature;

    private Integer isEnabled;

    private Integer isDefault;

    private Integer sortOrder;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
```

- [ ] **Step 5: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai/forge-module-ai-api
```

Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-api/src/main/java/com/forge/modules/ai/entity/
git commit -m "feat(ai): 添加 AI 模块实体类（AiConversation、AiMessage、AiDocument、AiModelConfig）"
```

---

### Task 4: 创建 Mapper 接口

**Files:**
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/mapper/AiConversationMapper.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/mapper/AiMessageMapper.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/mapper/AiDocumentMapper.java`
- Create: `apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/mapper/AiModelConfigMapper.java`

- [ ] **Step 1: 创建 AiConversationMapper**

```java
package com.forge.modules.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.forge.modules.ai.entity.AiConversation;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI 对话会话 Mapper
 */
@Mapper
public interface AiConversationMapper extends BaseMapper<AiConversation> {

}
```

- [ ] **Step 2: 创建 AiMessageMapper**

```java
package com.forge.modules.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.forge.modules.ai.entity.AiMessage;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI 消息记录 Mapper
 */
@Mapper
public interface AiMessageMapper extends BaseMapper<AiMessage> {

}
```

- [ ] **Step 3: 创建 AiDocumentMapper**

```java
package com.forge.modules.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.forge.modules.ai.entity.AiDocument;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI 文档 Mapper
 */
@Mapper
public interface AiDocumentMapper extends BaseMapper<AiDocument> {

}
```

- [ ] **Step 4: 创建 AiModelConfigMapper**

```java
package com.forge.modules.ai.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.forge.modules.ai.entity.AiModelConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI 模型配置 Mapper
 */
@Mapper
public interface AiModelConfigMapper extends BaseMapper<AiModelConfig> {

}
```

- [ ] **Step 5: 编译验证**

```bash
cd apps/forge-server
mvn compile -pl forge-module-ai
```

Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add apps/forge-server/forge-module-ai/forge-module-ai-biz/src/main/java/com/forge/modules/ai/mapper/
git commit -m "feat(ai): 添加 AI 模块 Mapper 接口"
```

---

### Task 5: 创建数据库迁移脚本

**Files:**
- Create: `apps/forge-server/forge-server/src/main/resources/db/migration/V2026061701__ai_module_tables.sql`

- [ ] **Step 1: 创建迁移脚本**

```sql
-- ========================================
-- AI 模块数据库表
-- ========================================

-- AI 对话会话表
CREATE TABLE IF NOT EXISTS `ai_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(100) DEFAULT NULL COMMENT '会话标题',
  `model_provider` varchar(20) NOT NULL COMMENT '模型提供商',
  `model_name` varchar(50) NOT NULL COMMENT '模型名称',
  `system_prompt` text DEFAULT NULL COMMENT '系统提示词',
  `status` tinyint DEFAULT 1 COMMENT '状态(0:结束 1:进行中)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话会话表';

-- AI 消息记录表
CREATE TABLE IF NOT EXISTS `ai_message` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `conversation_id` bigint NOT NULL COMMENT '会话ID',
  `role` varchar(10) NOT NULL COMMENT '角色(user/assistant/system)',
  `content` text NOT NULL COMMENT '消息内容',
  `tokens_used` int DEFAULT NULL COMMENT '消耗token数',
  `model_provider` varchar(20) DEFAULT NULL COMMENT '实际使用的模型',
  `response_time` int DEFAULT NULL COMMENT '响应时间(ms)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI消息记录表';

-- AI 文档表
CREATE TABLE IF NOT EXISTS `ai_document` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文档ID',
  `user_id` bigint NOT NULL COMMENT '上传用户ID',
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_type` varchar(20) NOT NULL COMMENT '文件类型',
  `file_size` bigint NOT NULL COMMENT '文件大小',
  `content` longtext DEFAULT NULL COMMENT '提取的文本内容',
  `summary` text DEFAULT NULL COMMENT 'AI生成的摘要',
  `status` tinyint DEFAULT 0 COMMENT '状态(0:待处理 1:处理中 2:已完成 3:失败)',
  `error_message` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `model_provider` varchar(20) DEFAULT NULL COMMENT '生成摘要的模型',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI文档表';

-- AI 模型配置表
CREATE TABLE IF NOT EXISTS `ai_model_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `provider` varchar(20) NOT NULL COMMENT '提供商',
  `model_name` varchar(50) NOT NULL COMMENT '模型名称',
  `api_key` varchar(200) DEFAULT NULL COMMENT 'API密钥(加密存储)',
  `api_url` varchar(200) DEFAULT NULL COMMENT 'API地址',
  `max_tokens` int DEFAULT 4096 COMMENT '最大token数',
  `temperature` decimal(3,2) DEFAULT 0.7 COMMENT '温度参数',
  `is_enabled` tinyint DEFAULT 1 COMMENT '是否启用',
  `is_default` tinyint DEFAULT 0 COMMENT '是否默认模型',
  `sort_order` int DEFAULT 0 COMMENT '排序',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_model` (`provider`, `model_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型配置表';
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-server/forge-server/src/main/resources/db/migration/V2026061701__ai_module_tables.sql
git commit -m "feat(ai): 添加 AI 模块数据库迁移脚本"
```

---

### Task 6: 创建菜单数据和权限

**Files:**
- Create: `apps/forge-server/forge-server/src/main/resources/db/migration/V2026061702__ai_module_menu.sql`

- [ ] **Step 1: 创建菜单迁移脚本**

```sql
-- ========================================
-- AI 模块菜单配置
-- ========================================

-- AI 管理目录（顶级目录）
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(300, 'AI 智能助手', 0, '/ai', 'Layout', '/ai/chat', 'ChatDotRound', 3, 0, NULL, 1, 1, 0, 0);

-- 智能对话菜单
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(301, '智能对话', 300, '/ai/chat', '/views/ai/chat/index', NULL, 'ChatLineRound', 1, 1, 'ai:chat:list', 1, 1, 0, 0);

-- 智能对话按钮权限
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(302, '对话创建', 301, '', '', NULL, '', 1, 2, 'ai:chat:create', 1, 1, 0, 0),
(303, '对话查询', 301, '', '', NULL, '', 2, 2, 'ai:chat:query', 1, 1, 0, 0),
(304, '对话删除', 301, '', '', NULL, '', 3, 2, 'ai:chat:delete', 1, 1, 0, 0);

-- 文档管理菜单
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(310, '文档管理', 300, '/ai/document', '/views/ai/document/index', NULL, 'Document', 2, 1, 'ai:document:list', 1, 1, 0, 0);

-- 文档管理按钮权限
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(311, '文档上传', 310, '', '', NULL, '', 1, 2, 'ai:document:upload', 1, 1, 0, 0),
(312, '文档摘要', 310, '', '', NULL, '', 2, 2, 'ai:document:summary', 1, 1, 0, 0),
(313, '文档查询', 310, '', '', NULL, '', 3, 2, 'ai:document:query', 1, 1, 0, 0),
(314, '文档删除', 310, '', '', NULL, '', 4, 2, 'ai:document:delete', 1, 1, 0, 0);

-- 模型配置菜单（管理员）
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(320, '模型配置', 300, '/ai/model', '/views/ai/model/index', NULL, 'SetUp', 3, 1, 'ai:model:list', 1, 1, 0, 0);

-- 模型配置按钮权限
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(321, '模型查询', 320, '', '', NULL, '', 1, 2, 'ai:model:query', 1, 1, 0, 0),
(322, '模型配置', 320, '', '', NULL, '', 2, 2, 'ai:model:config', 1, 1, 0, 0),
(323, '模型切换', 320, '', '', NULL, '', 3, 2, 'ai:model:switch', 1, 1, 0, 0);

-- ========================================
-- 角色授权（超级管理员拥有所有 AI 菜单）
-- ========================================
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, 300), (1, 301), (1, 302), (1, 303), (1, 304),
(1, 310), (1, 311), (1, 312), (1, 313), (1, 314),
(1, 320), (1, 321), (1, 322), (1, 323);
```

- [ ] **Step 2: Commit**

```bash
git add apps/forge-server/forge-server/src/main/resources/db/migration/V2026061702__ai_module_menu.sql
git commit -m "feat(ai): 添加 AI 模块菜单和权限数据"
```

---

### Task 7: 创建 init-ai.sql 初始化脚本

**Files:**
- Create: `sql/init-ai.sql`

- [ ] **Step 1: 创建 init-ai.sql**

```sql
-- ========================================
-- forge-admin AI 模块初始化脚本
-- 数据库版本: MySQL 8.0+
-- 创建时间: 2026-06-17
-- 说明: 本脚本仅包含 AI 模块相关的表结构和数据
-- 前置依赖: sql/init.sql (系统基础表)
-- ========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `forge_admin`;

-- ========================================
-- 1. AI 对话会话表
-- ========================================
DROP TABLE IF EXISTS `ai_conversation`;
CREATE TABLE `ai_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(100) DEFAULT NULL COMMENT '会话标题',
  `model_provider` varchar(20) NOT NULL COMMENT '模型提供商',
  `model_name` varchar(50) NOT NULL COMMENT '模型名称',
  `system_prompt` text DEFAULT NULL COMMENT '系统提示词',
  `status` tinyint DEFAULT 1 COMMENT '状态(0:结束 1:进行中)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话会话表';

-- ========================================
-- 2. AI 消息记录表
-- ========================================
DROP TABLE IF EXISTS `ai_message`;
CREATE TABLE `ai_message` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `conversation_id` bigint NOT NULL COMMENT '会话ID',
  `role` varchar(10) NOT NULL COMMENT '角色(user/assistant/system)',
  `content` text NOT NULL COMMENT '消息内容',
  `tokens_used` int DEFAULT NULL COMMENT '消耗token数',
  `model_provider` varchar(20) DEFAULT NULL COMMENT '实际使用的模型',
  `response_time` int DEFAULT NULL COMMENT '响应时间(ms)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI消息记录表';

-- ========================================
-- 3. AI 文档表
-- ========================================
DROP TABLE IF EXISTS `ai_document`;
CREATE TABLE `ai_document` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文档ID',
  `user_id` bigint NOT NULL COMMENT '上传用户ID',
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_type` varchar(20) NOT NULL COMMENT '文件类型',
  `file_size` bigint NOT NULL COMMENT '文件大小',
  `content` longtext DEFAULT NULL COMMENT '提取的文本内容',
  `summary` text DEFAULT NULL COMMENT 'AI生成的摘要',
  `status` tinyint DEFAULT 0 COMMENT '状态(0:待处理 1:处理中 2:已完成 3:失败)',
  `error_message` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `model_provider` varchar(20) DEFAULT NULL COMMENT '生成摘要的模型',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI文档表';

-- ========================================
-- 4. AI 模型配置表
-- ========================================
DROP TABLE IF EXISTS `ai_model_config`;
CREATE TABLE `ai_model_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `provider` varchar(20) NOT NULL COMMENT '提供商',
  `model_name` varchar(50) NOT NULL COMMENT '模型名称',
  `api_key` varchar(200) DEFAULT NULL COMMENT 'API密钥(加密存储)',
  `api_url` varchar(200) DEFAULT NULL COMMENT 'API地址',
  `max_tokens` int DEFAULT 4096 COMMENT '最大token数',
  `temperature` decimal(3,2) DEFAULT 0.7 COMMENT '温度参数',
  `is_enabled` tinyint DEFAULT 1 COMMENT '是否启用',
  `is_default` tinyint DEFAULT 0 COMMENT '是否默认模型',
  `sort_order` int DEFAULT 0 COMMENT '排序',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_model` (`provider`, `model_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型配置表';

-- ========================================
-- AI 模块菜单
-- ========================================

-- AI 管理目录（顶级目录）
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(300, 'AI 智能助手', 0, '/ai', 'Layout', '/ai/chat', 'ChatDotRound', 3, 0, NULL, 1, 1, 0, 0);

-- 智能对话菜单
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(301, '智能对话', 300, '/ai/chat', '/views/ai/chat/index', NULL, 'ChatLineRound', 1, 1, 'ai:chat:list', 1, 1, 0, 0);

-- 智能对话按钮权限
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(302, '对话创建', 301, '', '', NULL, '', 1, 2, 'ai:chat:create', 1, 1, 0, 0),
(303, '对话查询', 301, '', '', NULL, '', 2, 2, 'ai:chat:query', 1, 1, 0, 0),
(304, '对话删除', 301, '', '', NULL, '', 3, 2, 'ai:chat:delete', 1, 1, 0, 0);

-- 文档管理菜单
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(310, '文档管理', 300, '/ai/document', '/views/ai/document/index', NULL, 'Document', 2, 1, 'ai:document:list', 1, 1, 0, 0);

-- 文档管理按钮权限
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(311, '文档上传', 310, '', '', NULL, '', 1, 2, 'ai:document:upload', 1, 1, 0, 0),
(312, '文档摘要', 310, '', '', NULL, '', 2, 2, 'ai:document:summary', 1, 1, 0, 0),
(313, '文档查询', 310, '', '', NULL, '', 3, 2, 'ai:document:query', 1, 1, 0, 0),
(314, '文档删除', 310, '', '', NULL, '', 4, 2, 'ai:document:delete', 1, 1, 0, 0);

-- 模型配置菜单（管理员）
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(320, '模型配置', 300, '/ai/model', '/views/ai/model/index', NULL, 'SetUp', 3, 1, 'ai:model:list', 1, 1, 0, 0);

-- 模型配置按钮权限
INSERT INTO `sys_menu` (`id`, `menu_name`, `parent_id`, `route_path`, `component_path`, `redirect_path`, `icon`, `sort_order`, `menu_type`, `permission`, `status`, `visible`, `is_external`, `is_cached`) VALUES
(321, '模型查询', 320, '', '', NULL, '', 1, 2, 'ai:model:query', 1, 1, 0, 0),
(322, '模型配置', 320, '', '', NULL, '', 2, 2, 'ai:model:config', 1, 1, 0, 0),
(323, '模型切换', 320, '', '', NULL, '', 3, 2, 'ai:model:switch', 1, 1, 0, 0);

-- ========================================
-- 角色授权（超级管理员拥有所有 AI 菜单）
-- ========================================
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, 300), (1, 301), (1, 302), (1, 303), (1, 304),
(1, 310), (1, 311), (1, 312), (1, 313), (1, 314),
(1, 320), (1, 321), (1, 322), (1, 323);

-- ========================================
-- 初始化模型配置数据
-- ========================================
INSERT INTO `ai_model_config` (`provider`, `model_name`, `api_url`, `max_tokens`, `temperature`, `is_enabled`, `is_default`, `sort_order`, `remark`) VALUES
('deepseek', 'deepseek-chat', 'https://api.deepseek.com/v1', 4096, 0.7, 1, 1, 1, 'DeepSeek 默认模型'),
('deepseek', 'deepseek-coder', 'https://api.deepseek.com/v1', 4096, 0.7, 1, 0, 2, 'DeepSeek 代码模型'),
('qwen', 'qwen-turbo', 'https://dashscope.aliyuncs.com/api/v1', 4096, 0.7, 0, 0, 3, '通义千问快速版'),
('qwen', 'qwen-plus', 'https://dashscope.aliyuncs.com/api/v1', 8192, 0.7, 0, 0, 4, '通义千问增强版'),
('glm', 'glm-4-flash', 'https://open.bigmodel.cn/api/paas/v4', 4096, 0.7, 0, 0, 5, '智谱GLM快速版');

SET FOREIGN_KEY_CHECKS = 1;

-- 完成
SELECT 'AI 模块初始化完成!' AS message;
```

- [ ] **Step 2: Commit**

```bash
git add sql/init-ai.sql
git commit -m "feat(ai): 添加 AI 模块初始化脚本 init-ai.sql"
```

---

### Task 8: 全量编译验证

- [ ] **Step 1: 编译整个项目**

```bash
cd apps/forge-server
mvn clean compile
```

Expected: BUILD SUCCESS

- [ ] **Step 2: 最终 Commit（如有遗漏文件）**

```bash
git status
git add -A
git commit -m "feat(ai): 完成 AI 模块基础数据层"
```