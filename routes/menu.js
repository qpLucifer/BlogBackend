const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole } = require('../middleware/permissions');
const { Menu, Role, RoleMenu } = require('../models/admin');

// 需要认证
router.use(authenticate);
// 需要管理员角色
router.use(checkRole('admin'));

// 获取所有菜单
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.findAll({ order: [['order', 'ASC']] });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: '获取菜单失败' });
  }
});

// 新建菜单
router.post('/', async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ error: '创建菜单失败', detail: error.message });
  }
});

// 更新菜单
router.put('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ error: '菜单不存在' });
    await menu.update(req.body);
    res.json(menu);
  } catch (error) {
    res.status(400).json({ error: '更新菜单失败', detail: error.message });
  }
});

// 删除菜单
router.delete('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ error: '菜单不存在' });
    await menu.destroy();
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ error: '删除菜单失败', detail: error.message });
  }
});

// 获取角色的菜单
router.get('/role/:roleId', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.roleId, {
      include: [{ model: Menu }]
    });
    if (!role) return res.status(404).json({ error: '角色不存在' });
    res.json(role.Menus);
  } catch (error) {
    res.status(500).json({ error: '获取角色菜单失败' });
  }
});

// 给角色分配菜单
router.post('/role/:roleId', async (req, res) => {
  try {
    const { menuIds } = req.body; // menuIds: [1,2,3]
    const role = await Role.findByPk(req.params.roleId);
    if (!role) return res.status(404).json({ error: '角色不存在' });
    await role.setMenus(menuIds);
    res.json({ message: '分配成功' });
  } catch (error) {
    res.status(400).json({ error: '分配菜单失败', detail: error.message });
  }
});

module.exports = router; 