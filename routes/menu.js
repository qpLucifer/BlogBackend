const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { Menu, Role, RoleMenu } = require('../models/admin');
const { buildMenuTree } = require('../utils/tool');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取所有菜单
router.get('/', checkMenuPermission('菜单管理','can_read'), async (req, res) => {
  try {
    const menus = await Menu.findAll({ 
      order: [['order', 'ASC']] 
    });
    res.json(menus);
  } catch (error) {
    fail(res, '获取菜单失败', 500);
  }
});

// 新建菜单
router.post('/', checkMenuPermission('菜单管理','can_create'), async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    success(res, menu, '创建菜单成功', 200);
  } catch (error) {
    fail(res, error.message || '创建菜单失败', 400);
  }
});

// 更新菜单
router.put('/:id', checkMenuPermission('菜单管理','can_update'), async (req, res) => {
  try {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return fail(res, '菜单不存在', 404);
    await menu.update(req.body);
    success(res, menu, '更新菜单成功');
  } catch (error) {
    fail(res, error.message || '更新菜单失败', 400);
  }
});

// 删除菜单
router.delete('/:id', checkMenuPermission('菜单管理','can_delete'), async (req, res) => {
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
router.get('/role/:roleId', checkMenuPermission('菜单管理','can_read'), async (req, res) => {
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
router.post('/role/:roleId', checkMenuPermission('菜单管理','can_update'), async (req, res) => {
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

// 获取菜单树
router.get('/tree', checkMenuPermission('菜单管理','can_read'), async (req, res) => {
  try {
    const { name, path } = req.query;

    // 构建查询条件
    const whereConditions = {};
    if (name) {
      whereConditions.name = { [Op.like]: `%${name}%` };
    }
    if (path) {
      whereConditions.path = { [Op.like]: `%${path}%` };
    }

    const menus = await Menu.findAll({
      where: whereConditions,
      order: [['order', 'ASC']]
    });
    const menuList = menus.map(menu => menu.toJSON());
    const menuTree = buildMenuTree(menuList);
    success(res, menuTree, '获取菜单树成功');
  } catch (error) {
    console.log(error);
    fail(res, '获取菜单树失败', 500);
  }
});

// 导出菜单
router.get('/export', checkMenuPermission('菜单管理','can_read'), async (req, res) => {
  try {
    const { name, path } = req.query;

    // 构建查询条件
    const whereConditions = {};
    if (name) {
      whereConditions.name = { [Op.like]: `%${name}%` };
    }
    if (path) {
      whereConditions.path = { [Op.like]: `%${path}%` };
    }

    const menus = await Menu.findAll({
      where: whereConditions,
      attributes: ['id', 'name', 'path', 'icon', 'parent_id', 'order'],
      order: [['order', 'ASC']]
    });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=menus_${new Date().toISOString().split('T')[0]}.xlsx`);

    // 构建Excel数据
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();

    const worksheetData = [
      ['ID', '菜单名', '路径', '图标', '父菜单ID', '排序'], // 表头
      ...menus.map(menu => [
        menu.id,
        menu.name,
        menu.path,
        menu.icon || '',
        menu.parent_id || '',
        menu.order
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '菜单列表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);

  } catch (error) {
    console.error('导出菜单失败:', error);
    fail(res, '导出菜单失败', 500);
  }
});

module.exports = router;