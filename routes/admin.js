// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole } = require('../middleware/permissions');
const { User, Role, Permission } = require('../models/admin');

// 需要认证
router.use(authenticate);

// 需要管理员角色或特定权限
router.use(checkRole('admin')); // 或者使用 checkPermission('user:write')

// 获取所有用户
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'is_active', 'created_at'],
      include: [{
        model: Role,
        attributes: ['id', 'name'],
        through: { attributes: [] },
        as:"roles"
      }]
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 更新用户
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, is_active, roles } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    await user.update({ username, email, is_active });
    if (roles) {
      await user.setRoles(roles);
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '更新用户失败' });
  }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    await user.destroy();
    res.json({ message: '用户删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除用户失败' });
  }
});

// 获取所有角色
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] },
        as: "permissions",
      }]
    });
    
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

module.exports = router;