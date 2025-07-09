// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { User, Role, Menu, RoleMenu} = require('../models/admin');
const { hashPassword } = require('../utils/auth');

// 需要认证
router.use(authenticate);

// 获取所有用户
router.get('/users',checkMenuPermission('用户管理','can_read'), async (req, res) => {
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

// 新增用户
router.post('/users',checkMenuPermission('用户管理','can_create'), async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ username, email, password_hash:hashedPassword });
    if (roles) {
      await user.setRoles(roles);
    }
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '新增用户失败' });
  }
});

// 更新用户
router.put('/users/:id',checkMenuPermission('用户管理','can_update'), async (req, res) => {
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

// 更新用户个人信息
router.put('/users/:id/profile',checkMenuPermission('用户管理','can_update'), async (req, res) => {
  try {
    const { mood, signature } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    await user.update({ mood, signature });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '更新用户个人信息失败' });
  }
});

// 删除用户
router.delete('/users/:id',checkMenuPermission('用户管理','can_delete'), async (req, res) => {
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

module.exports = router;