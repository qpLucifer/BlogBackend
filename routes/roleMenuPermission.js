const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkRole } = require('../middleware/permissions');
const { RoleMenuPermission, Menu } = require('../models/admin');

// 需要认证
router.use(authenticate);
// 需要管理员角色
router.use(checkRole('admin'));

// 获取某角色所有菜单及权限
router.get('/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    const permissions = await RoleMenuPermission.findAll({
      where: { role_id: roleId },
      include: [{ model: Menu, attributes: ['id', 'name', 'path', 'icon', 'parent_id'] }]
    });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: '获取角色菜单权限失败', detail: error.message });
  }
});

// 设置某角色某菜单的权限（增删改查）
router.post('/:roleId/:menuId', async (req, res) => {
  try {
    const { roleId, menuId } = req.params;
    const { can_create, can_read, can_update, can_delete } = req.body;
    let record = await RoleMenuPermission.findOne({ where: { role_id: roleId, menu_id: menuId } });
    if (record) {
      await record.update({ can_create, can_read, can_update, can_delete });
    } else {
      record = await RoleMenuPermission.create({
        role_id: roleId,
        menu_id: menuId,
        can_create: !!can_create,
        can_read: !!can_read,
        can_update: !!can_update,
        can_delete: !!can_delete
      });
    }
    res.json({ message: '权限设置成功', data: record });
  } catch (error) {
    res.status(400).json({ error: '设置权限失败', detail: error.message });
  }
});

module.exports = router; 