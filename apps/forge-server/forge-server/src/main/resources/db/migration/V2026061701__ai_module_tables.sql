-- ========================================
-- AI 模块 - 数据库表结构
-- ========================================

-- AI 会话表
CREATE TABLE IF NOT EXISTS `ai_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(200) DEFAULT NULL COMMENT '会话标题',
  `model_provider` varchar(50) NOT NULL COMMENT '模型提供商(openai/anthropic/google/zhipu)',
  `model_name` varchar(100) NOT NULL COMMENT '模型名称',
  `system_prompt` text DEFAULT NULL COMMENT '系统提示词',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态(0:已结束 1:进行中)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_model_provider` (`model_provider`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI会话表';

-- AI 消息表
CREATE TABLE IF NOT EXISTS `ai_message` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `conversation_id` bigint NOT NULL COMMENT '会话ID',
  `role` varchar(20) NOT NULL COMMENT '角色(user/assistant/system)',
  `content` longtext NOT NULL COMMENT '消息内容',
  `tokens_used` int DEFAULT 0 COMMENT '消耗Token数',
  `model_provider` varchar(50) DEFAULT NULL COMMENT '响应模型提供商',
  `response_time` int DEFAULT NULL COMMENT '响应时间(毫秒)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_role` (`role`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI消息表';

-- AI 文档表
CREATE TABLE IF NOT EXISTS `ai_document` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `file_name` varchar(255) NOT NULL COMMENT '文件名称',
  `file_path` varchar(500) NOT NULL COMMENT '文件存储路径',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型(pdf/docx/txt/md)',
  `file_size` bigint DEFAULT 0 COMMENT '文件大小(字节)',
  `content` longtext DEFAULT NULL COMMENT '提取的文本内容',
  `summary` text DEFAULT NULL COMMENT 'AI生成的摘要',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态(0:待处理 1:处理中 2:已完成 3:失败)',
  `error_message` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `model_provider` varchar(50) DEFAULT NULL COMMENT '处理模型提供商',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI文档表';

-- AI 模型配置表
CREATE TABLE IF NOT EXISTS `ai_model_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `provider` varchar(50) NOT NULL COMMENT '提供商(openai/anthropic/google/zhipu)',
  `model_name` varchar(100) NOT NULL COMMENT '模型名称',
  `api_key` varchar(255) DEFAULT NULL COMMENT 'API密钥',
  `api_url` varchar(255) DEFAULT NULL COMMENT 'API地址',
  `max_tokens` int DEFAULT 4096 COMMENT '最大Token数',
  `temperature` decimal(3,2) DEFAULT 0.70 COMMENT '温度参数(0-2)',
  `is_enabled` tinyint NOT NULL DEFAULT 1 COMMENT '是否启用(0:禁用 1:启用)',
  `is_default` tinyint NOT NULL DEFAULT 0 COMMENT '是否默认(0:否 1:是)',
  `sort_order` int DEFAULT 0 COMMENT '排序',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT 0 COMMENT '删除标记',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_model` (`provider`, `model_name`),
  KEY `idx_provider` (`provider`),
  KEY `idx_is_enabled` (`is_enabled`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI模型配置表';