// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/admin');

const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户并附加到请求对象
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'is_active'],
      include: [{
        model: Role,
        attributes: ['id', 'name'],
        through: { attributes: [] },
        as:"roles",
      }]
    });
    
    if (!user) {
      return res.status(401).json({ error: '无效用户' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: '用户账户已被禁用' });
    }

    req.user = {
      ...user.get({ plain: true }),
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    console.log('认证错误:', error);
    res.status(401).json({ error: '无效令牌' });
  }
};

module.exports = authenticate;