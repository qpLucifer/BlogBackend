// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models/admin');

const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    console.log('认证中间件被调用', token);

    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('解码后的令牌:', decoded);
    
    // 查找用户并附加到请求对象
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'is_active'],
      include: [{
        model: Role,
        attributes: ['id', 'name'],
        through: { attributes: [] },
        as:"roles",
        include: [{
          model: Permission,
          attributes: ['id', 'name'],
          through: { attributes: [] },
          as:"permissions"
        }]
      }]
    });
    
    if (!user) {
      return res.status(401).json({ error: '无效用户' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: '用户账户已被禁用' });
    }
    
    // 将用户权限扁平化处理
    const permissions = new Set();
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission.name);
      });
    });
    req.user = {
      ...user.get({ plain: true }),
      permissions: Array.from(permissions)
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    res.status(401).json({ error: '无效令牌' });
  }
};

module.exports = authenticate;