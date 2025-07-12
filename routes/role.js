// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { Role, Menu, RoleMenu} = require('../models/admin');

// 需要认证
router.use(authenticate);

// 获取所有角色
router.get('/roles', checkMenuPermission('角色管理','can_read'), async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Menu,
        attributes: ['id', 'name', 'path'],
        through: { attributes: ['can_create', 'can_read', 'can_update', 'can_delete'], as: "roleMenu" },
        as: "menus"
      }]
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

// 创建角色
router.post('/roles', checkMenuPermission('角色管理','can_create'), async (req, res) => {
  try {
    const { name, description, menus } = req.body;
    const role = await Role.create({ name, description });
    if (menus && Array.isArray(menus)) {
      // 准备批量插入数据
      const menuPermissions = menus.map((menu) => ({
        role_id: role.id,
        menu_id: menu.menuId,
        ...menu.roleMenu,
      }));

      // 批量创建关联
      await RoleMenu.bulkCreate(menuPermissions);
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: '创建角色失败' });
  }
});

// 更新角色
router.put('/roles/:id', checkMenuPermission('角色管理','can_update'), async (req, res) => {
  try {
    const { name, description, menus } = req.body;
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: '角色不存在' });
    }
    await role.update({ name, description });
    // 删除所有现有关联
    await RoleMenu.destroy({ where: { role_id: role.id } });
    if (menus && Array.isArray(menus)) {
      // 准备批量插入数据
      const menuPermissions = menus.map((menu) => ({
        role_id: role.id,
        menu_id: menu.menuId,
        ...menu.roleMenu,
      }));

      // 批量创建关联
      await RoleMenu.bulkCreate(menuPermissions);
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: '更新角色失败' });
  }
});

// 删除角色
router.delete('/roles/:id', checkMenuPermission('角色管理','can_delete'), async (req, res) => {
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


module.exports = router;