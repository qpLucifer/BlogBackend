const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { Menu, Role, RoleMenu } = require('../models/admin');
const { buildMenuTree } = require('../utils/tool');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');
const { catchAsync } = require('../middleware/errorHandler');
const SimpleLogger = require('../utils/logger');

// 需要认证
router.use(authenticate);

// 获取所有菜单
router.get('/', checkMenuPermission('菜单管理','can_read'), catchAsync(async (req, res) => {
  const menus = await Menu.findAll({
    order: [['order', 'ASC']]
  });
  success(res, menus, '获取菜单成功');
}));

// 新建菜单
router.post('/', checkMenuPermission('菜单管理','can_create'), catchAsync(async (req, res) => {
  const menu = await Menu.create(req.body);

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'create',
    'menu',
    menu.id,
    menu.name,
    req.ip,
    req.get('User-Agent'),
    { path: menu.path, icon: menu.icon, order: menu.order }
  );

  success(res, menu, '创建菜单成功', 200);
}));

// 更新菜单
router.put('/:id', checkMenuPermission('菜单管理','can_update'), catchAsync(async (req, res) => {
  const menu = await Menu.findByPk(req.params.id);
  if (!menu) return fail(res, '菜单不存在', 404);

  const oldName = menu.name;
  const oldPath = menu.path;
  await menu.update(req.body);

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'update',
    'menu',
    menu.id,
    menu.name,
    req.ip,
    req.get('User-Agent'),
    {
      old_name: oldName,
      new_name: menu.name,
      old_path: oldPath,
      new_path: menu.path
    }
  );

  success(res, menu, '更新菜单成功');
}));

// 删除菜单
router.delete('/:id', checkMenuPermission('菜单管理','can_delete'), catchAsync(async (req, res) => {
  const menu = await Menu.findByPk(req.params.id);
  if (!menu) return fail(res, '菜单不存在', 404);

  const menuName = menu.name;
  const menuPath = menu.path;
  await menu.destroy();

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'delete',
    'menu',
    req.params.id,
    menuName,
    req.ip,
    req.get('User-Agent'),
    { deleted_name: menuName, deleted_path: menuPath }
  );

  success(res, null, '删除菜单成功');
}));

// 获取角色的菜单
router.get('/role/:roleId', checkMenuPermission('菜单管理','can_read'), catchAsync(async (req, res) => {
  const role = await Role.findByPk(req.params.roleId, {
    include: [{ model: Menu }]
  });
  if (!role) return fail(res, '角色不存在', 404);
  success(res, role.Menus, '获取角色菜单成功');
}));

// 给角色分配菜单
router.post('/role/:roleId', checkMenuPermission('菜单管理','can_update'), catchAsync(async (req, res) => {
  const { menuIds } = req.body; // menuIds: [1,2,3]
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return fail(res, '角色不存在', 404);
  await role.setMenus(menuIds);
  success(res, null, '分配菜单成功');
}));

// 获取菜单树
router.get('/tree', checkMenuPermission('菜单管理','can_read'), catchAsync(async (req, res) => {
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
}));

// 导出菜单
router.get('/export', checkMenuPermission('菜单管理','can_read'), catchAsync(async (req, res) => {
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
}));

module.exports = router;