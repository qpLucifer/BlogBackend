// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

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
      include: [{
        model: Role,
        include: [Permission]
      }]
    });
    
    if (!user) {
      return res.status(401).json({ error: '无效用户' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效令牌' });
  }
};

module.exports = authenticate;