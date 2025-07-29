-- 添加系统管理菜单
-- 注意：请根据实际的菜单ID调整parent_id

-- 1. 添加系统管理父菜单（如果不存在）
INSERT INTO menus (name, path, icon, parent_id, `order`, component, created_at, updated_at) 
VALUES ('系统管理', '/system', 'SettingOutlined', NULL, 100, NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 获取系统管理菜单的ID（假设为最新插入的ID）
SET @system_menu_id = LAST_INSERT_ID();

-- 如果系统管理菜单已存在，需要手动设置ID
-- SET @system_menu_id = (SELECT id FROM menus WHERE name = '系统管理' AND parent_id IS NULL);

-- 2. 添加日志管理菜单
INSERT INTO menus (name, path, icon, parent_id, `order`, component, created_at, updated_at) 
VALUES ('日志管理', '/system/logs', 'FileTextOutlined', @system_menu_id, 101, 'system/logs', NOW(), NOW());

-- 3. 添加性能监控菜单
INSERT INTO menus (name, path, icon, parent_id, `order`, component, created_at, updated_at) 
VALUES ('性能监控', '/system/performance', 'DashboardOutlined', @system_menu_id, 102, 'system/performance', NOW(), NOW());

-- 4. 为超级管理员角色添加权限（假设超级管理员角色ID为1）
-- 获取新添加的菜单ID
SET @logs_menu_id = (SELECT id FROM menus WHERE name = '日志管理' AND parent_id = @system_menu_id);
SET @performance_menu_id = (SELECT id FROM menus WHERE name = '性能监控' AND parent_id = @system_menu_id);

-- 为超级管理员添加日志管理权限
INSERT INTO role_menus (role_id, menu_id, can_create, can_read, can_update, can_delete, created_at, updated_at)
VALUES (1, @logs_menu_id, true, true, true, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  can_create = VALUES(can_create),
  can_read = VALUES(can_read),
  can_update = VALUES(can_update),
  can_delete = VALUES(can_delete),
  updated_at = VALUES(updated_at);

-- 为超级管理员添加性能监控权限
INSERT INTO role_menus (role_id, menu_id, can_create, can_read, can_update, can_delete, created_at, updated_at)
VALUES (1, @performance_menu_id, true, true, true, false, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  can_create = VALUES(can_create),
  can_read = VALUES(can_read),
  can_update = VALUES(can_update),
  can_delete = VALUES(can_delete),
  updated_at = VALUES(updated_at);

-- 为超级管理员添加系统管理父菜单权限
INSERT INTO role_menus (role_id, menu_id, can_create, can_read, can_update, can_delete, created_at, updated_at)
VALUES (1, @system_menu_id, false, true, false, false, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  can_create = VALUES(can_create),
  can_read = VALUES(can_read),
  can_update = VALUES(can_update),
  can_delete = VALUES(can_delete),
  updated_at = VALUES(updated_at);

-- 查看添加的菜单
SELECT 
  m.id,
  m.name,
  m.path,
  m.icon,
  m.parent_id,
  m.order,
  m.component,
  p.name as parent_name
FROM menus m
LEFT JOIN menus p ON m.parent_id = p.id
WHERE m.name IN ('系统管理', '日志管理', '性能监控')
ORDER BY m.parent_id, m.order;
