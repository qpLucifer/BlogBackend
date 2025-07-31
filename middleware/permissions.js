const {permissionNameObj} = require('../utils/tool');
const { fail } = require('../utils/response');
const SimpleLogger = require('../utils/logger');
// middleware/permissions.js - 权限中间件
const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // 确保用户已加载权限
      if (!req.user || !req.user.permissions) {
        return fail(res, '用户未认证', 401);
      }
      
      // 检查用户是否有指定权限
      const hasPermission = req.user.permissions.includes(permissionName);
      
      if (!hasPermission) {
        // 记录权限不足的安全日志
        await SimpleLogger.logOperation(
          req.user.id,
          req.user.username,
          'error',
          'permission',
          null,
          `${req.method} ${req.originalUrl}`,
          req.ip,
          req.get('User-Agent') || '',
          {
            error_type: 'permission_denied',
            required_permission: permissionName,
            user_permissions: req.user.permissions
          },
          'security'
        );
        return fail(res, '权限不足', 403, {
          required: permissionName,
          current: req.user.permissions
        });
      }
      
      next();
    } catch (error) {
      fail(res, '权限验证失败', 500);
    }
  };
};
// 检查菜单的增删改查权限
const checkMenuPermission = (menuName,permissionName) => {
  return async (req, res, next) => {
    try {
      // 确保用户已加载权限
      if (!req.user) {
        return fail(res, '用户未认证', 401);
      }
      if (!req.menus) {
        return fail(res, '菜单权限不足', 403);
      }
      
      // 递归查找菜单权限
      function findMenuPermissionRecursive(menus, targetMenuName) {
        for (const menu of menus) {
          if (menu.name === targetMenuName) {
            return menu;
          }
          if (menu.children && menu.children.length > 0) {
            const found = findMenuPermissionRecursive(menu.children, targetMenuName);
            if (found) return found;
          }
        }
        return null;
      }
      
      // 检查用户是否有指定权限
      const hasPermission = findMenuPermissionRecursive(req.menus, menuName);
      if (!hasPermission) {
        // 记录菜单权限不足的安全日志
        await SimpleLogger.logOperation(
          req.user.id,
          req.user.username,
          'error',
          'menu_permission',
          null,
          `${req.method} ${req.originalUrl}`,
          req.ip,
          req.get('User-Agent') || '',
          {
            error_type: 'menu_not_found',
            required_menu: menuName,
            user_menus: req.menus.map(m => m.name)
          },
          'security'
        );
        return fail(res, '菜单权限不足', 403);
      }
      if (!hasPermission[permissionName]) {
        // 记录菜单操作权限不足的安全日志
        await SimpleLogger.logOperation(
          req.user.id,
          req.user.username,
          'error',
          'menu_permission',
          null,
          `${req.method} ${req.originalUrl}`,
          req.ip,
          req.get('User-Agent') || '',
          {
            error_type: 'menu_operation_denied',
            required_menu: menuName,
            required_permission: permissionName,
            menu_permissions: hasPermission
          },
          'security'
        );
        return fail(res, menuName+ '菜单'+permissionNameObj[permissionName]+'权限不足', 403, { required: permissionName });
      }
      
      next();
    } catch (error) {
      fail(res, '权限验证失败', 500);
    }
  };
};
// 检查角色中间件
const checkRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return fail(res, '用户未认证', 401);
      }
      
      const hasRole = req.user.roles.some(role => role.name === roleName);
      
      if (!hasRole) {
        // 记录角色权限不足的安全日志
        await SimpleLogger.logOperation(
          req.user.id,
          req.user.username,
          'error',
          'role_permission',
          null,
          `${req.method} ${req.originalUrl}`,
          req.ip,
          req.get('User-Agent') || '',
          {
            error_type: 'role_denied',
            required_role: roleName,
            user_roles: req.user.roles.map(r => r.name)
          },
          'security'
        );
        return fail(res, '角色权限不足', 403, {
          required: roleName,
          current: req.user.roles.map(r => r.name)
        });
      }
      
      next();
    } catch (error) {
      console.log('用户角色:', error);
      fail(res, '角色验证失败', 500);
    }
  };
};

module.exports = {
  checkPermission,
  checkRole,
  checkMenuPermission
};