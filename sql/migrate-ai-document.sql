-- ========================================
-- AI文档表结构迁移
-- 执行时间: 2026-06-17
-- ========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `forge_admin`;

-- 新增附件关联字段
ALTER TABLE `ai_document` ADD COLUMN `attachment_id` bigint DEFAULT NULL COMMENT '附件ID' AFTER `user_id`;
ALTER TABLE `ai_document` ADD KEY `idx_attachment_id` (`attachment_id`);

-- 移除冗余字段（文件信息通过附件表获取）
ALTER TABLE `ai_document` DROP COLUMN `file_path`;
ALTER TABLE `ai_document` DROP COLUMN `file_url`;
ALTER TABLE `ai_document` DROP COLUMN `file_size`;
ALTER TABLE `ai_document` DROP COLUMN `file_type`;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'AI文档表迁移完成!' AS message;