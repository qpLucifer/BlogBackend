// middleware/permissions.js
const checkPermission = (permissionName) => {
    return async (req, res, next) => {
      try {
        // 确保用户已加载角色和权限
        if (!req.user || !req.user.Roles) {
          return res.status(401).json({ error: '用户未认证' });
        }
        
        // 检查用户是否有指定权限
        const hasPermission = req.user.Roles.some(role => 
          role.Permissions.some(perm => perm.name === permissionName)
        );
        
        if (!hasPermission) {
          return res.status(403).json({ error: '权限不足' });
        }
        
        next();
      } catch (error) {
        res.status(500).json({ error: '权限验证失败' });
      }
    };
  };
  
  module.exports = checkPermission;