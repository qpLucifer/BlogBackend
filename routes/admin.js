// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole } = require('../middleware/permissions');
const { User, Role, Permission, Menu } = require('../models/admin');

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

// 更新用户个人信息
router.put('/users/:id/profile', async (req, res) => {
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
      },{
        model: Menu,
        attributes: ['id', 'name', 'path'],
        through: { attributes: [] },
        as: "menus",  
      }]
    });
    
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

// 创建角色
router.post('/roles', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.create({ name, description });
    if (permissions) {
      await role.setPermissions(permissions);
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: '创建角色失败' });
  }
});

// 更新角色
router.put('/roles/:id', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: '角色不存在' });
    }
    await role.update({ name, description });
    if (permissions) {
      await role.setPermissions(permissions);
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: '更新角色失败' });
  }
});

// 删除角色
router.delete('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: '角色不存在' });
    }
    await role.destroy();
    res.json({ message: '角色删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除角色失败' });
  }
});

// 获取所有权限
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: '获取权限列表失败' });
  }
});

// 创建权限
router.post('/permissions', async (req, res) => {
  try {
    const { name, description } = req.body;
    const permission = await Permission.create({ name, description });
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: '创建权限失败' });
  }
});

// 更新权限
router.put('/permissions/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: '权限不存在' });
    }
    await permission.update({ name, description });
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: '更新权限失败' });
  }
});

// 删除权限
router.delete('/permissions/:id', async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: '权限不存在' });
    }
    await permission.destroy();
    res.json({ message: '权限删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除权限失败' });
  }
});



module.exports = router;