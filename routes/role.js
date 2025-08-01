// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { Role, Menu, RoleMenu} = require('../models/admin');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');
const { catchAsync } = require('../middleware/errorHandler');
const SimpleLogger = require('../utils/logger');

// 需要认证
router.use(authenticate);

// 获取所有角色
router.get('/listAll', catchAsync(async (req, res) => {
  const roles = await Role.findAll({
    attributes: ['id', 'name'],
  });
  success(res, roles, '获取角色列表成功');
}));

// 分页获取所有角色
router.get('/listPage', checkMenuPermission('角色管理','can_read'), catchAsync(async (req, res) => {
  const { name, pageSize = 10, currentPage = 1 } = req.query;

  // 构建查询条件
  const whereConditions = {};
  if (name) {
    whereConditions.name = { [Op.like]: `%${name}%` };
  }

  // 获取总数
  const total = await Role.count({ where: whereConditions });

  // 获取分页数据
  const roles = await Role.findAll({
    include: [{
      model: Menu,
      attributes: ['id', 'name', 'path'],
      through: { attributes: ['can_create', 'can_read', 'can_update', 'can_delete'], as: "roleMenu" },
      as: "menus"
    }],
    where: whereConditions,
    limit: parseInt(pageSize),
    offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
  });

  success(res, {
    list: roles,
    total: total,
    pageSize: parseInt(pageSize),
    currentPage: parseInt(currentPage),
  }, '获取角色列表成功');
}));

// 创建角色
router.post('/roles', checkMenuPermission('角色管理','can_create'), catchAsync(async (req, res) => {
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

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'create',
    'role',
    role.id,
    role.name,
    req.ip,
    req.get('User-Agent'),
    { description, menus: menus || [] },
    'operation'
  );

  success(res, role, '创建角色成功');
}));

// 更新角色
router.put('/roles/:id', checkMenuPermission('角色管理','can_update'), catchAsync(async (req, res) => {
  const { name, description, menus } = req.body;
  const role = await Role.findByPk(req.params.id);
  if (!role) {
    return fail(res, '角色不存在', 404);
  }

  const oldName = role.name;
  const oldDescription = role.description;

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

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'update',
    'role',
    role.id,
    role.name,
    req.ip,
    req.get('User-Agent'),
    {
      old_name: oldName,
      new_name: name,
      old_description: oldDescription,
      new_description: description,
      menus: menus || []
    },
    'operation',
    'success'
  );

  success(res, role, '更新角色成功');
}));

// 删除角色
router.delete('/roles/:id', checkMenuPermission('角色管理','can_delete'), catchAsync(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) {
    return fail(res, '角色不存在', 404);
  }

  const roleName = role.name;
  const roleDescription = role.description;
  await role.destroy();

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'delete',
    'role',
    req.params.id,
    roleName,
    req.ip,
    req.get('User-Agent'),
    { deleted_name: roleName, deleted_description: roleDescription },
    'operation'
  );

  success(res, null, '角色删除成功');
}));

// 导出角色
router.get('/export', checkMenuPermission('角色管理','can_read'), catchAsync(async (req, res) => {
  const { name } = req.query;

  // 构建查询条件
  const whereConditions = {};
  if (name) {
    whereConditions.name = { [Op.like]: `%${name}%` };
  }

  const roles = await Role.findAll({
    include: [{
      model: Menu,
      attributes: ['name'],
      through: { attributes: [] },
      as: "menus"
    }],
    where: whereConditions,
    attributes: ['id', 'name', 'description'],
    order: [['id', 'ASC']]
  });

  // 设置响应头
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=roles_${new Date().toISOString().split('T')[0]}.xlsx`);

  // 构建Excel数据
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();

  const worksheetData = [
    ['ID', '角色名', '描述', '关联菜单'], // 表头
    ...roles.map(role => [
      role.id,
      role.name,
      role.description || '',
      role.menus ? role.menus.map(menu => menu.name).join(', ') : ''
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '角色列表');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.send(buffer);
}));

module.exports = router;