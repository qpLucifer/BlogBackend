// routes/admin.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');
const { User } = require('../models');

// 需要认证
router.use(authenticate);

// 需要管理员权限
router.use(checkPermission('admin_access'));

// 获取所有用户
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

module.exports = router;