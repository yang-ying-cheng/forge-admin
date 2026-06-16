-- V2026061601__app_user_extend.sql

-- 1. 新增字段
ALTER TABLE app_user
    ADD COLUMN phone_verified TINYINT NOT NULL DEFAULT 0
        COMMENT '手机号是否已验证（0否 1是）' AFTER phone,
    ADD COLUMN deactivated_time DATETIME DEFAULT NULL
        COMMENT '注销时间，NULL表示未注销' AFTER last_login_time;

-- 2. 调整 open_id 唯一约束
ALTER TABLE app_user DROP INDEX uk_open_id;
ALTER TABLE app_user ADD UNIQUE KEY uk_open_id_active (open_id, deleted);

-- 3. App用户菜单（挂在系统管理下）
-- 先查询系统管理菜单的 id，避免硬编码
SET @system_parent_id = (SELECT id FROM sys_menu WHERE route_path = '/system' AND parent_id = 0 LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, route_path, component_path, icon, sort_order, menu_type, permission, status, visible, is_external, is_cached)
VALUES ('App用户', @system_parent_id, '/system/app-user', 'system/app-user/index', 'User', 5, 1, 'system:app-user:list', 1, 1, 0, 0);

SET @app_user_menu_id = LAST_INSERT_ID();

-- 按钮权限
INSERT INTO sys_menu (menu_name, parent_id, route_path, component_path, icon, sort_order, menu_type, permission, status, visible, is_external, is_cached) VALUES
('详情', @app_user_menu_id, '', '', '', 1, 2, 'system:app-user:detail', 1, 1, 0, 0),
('修改', @app_user_menu_id, '', '', '', 2, 2, 'system:app-user:update', 1, 1, 0, 0),
('删除', @app_user_menu_id, '', '', '', 3, 2, 'system:app-user:delete', 1, 1, 0, 0);

-- 给超级管理员授权
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(1, @app_user_menu_id + 0),
(1, @app_user_menu_id + 1),
(1, @app_user_menu_id + 2),
(1, @app_user_menu_id + 3);