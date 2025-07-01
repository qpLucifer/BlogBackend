// middleware/permissions.js - 权限中间件
const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // 确保用户已加载权限
      if (!req.user || !req.user.permissions) {
        return res.status(401).json({ error: '用户未认证' });
      }
      
      // 检查用户是否有指定权限
      const hasPermission = req.user.permissions.includes(permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: '权限不足',
          required: permissionName,
          current: req.user.permissions
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: '权限验证失败' });
    }
  };
};

// 检查角色中间件
const checkRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ error: '用户未认证' });
      }
      
      const hasRole = req.user.roles.some(role => role.name === roleName);
      
      if (!hasRole) {
        return res.status(403).json({ 
          error: '角色权限不足',
          required: roleName,
          current: req.user.roles.map(r => r.name)
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: '角色验证失败' });
    }
  };
};

module.exports = {
  checkPermission,
  checkRole
};