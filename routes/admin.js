// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole } = require('../middleware/permissions');
const { User, Role } = require('../models/admin');

// 需要认证
router.use(authenticate);

// 需要管理员角色或特定权限
router.use(checkRole('admin')); // 或者使用 checkPermission('user:write')

// 获取所有用户
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'is_active', 'created_at'],
      include: [{
        model: Role,
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }]
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取所有角色
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }]
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

module.exports = router;