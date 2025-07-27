// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { Role, Menu, RoleMenu} = require('../models/admin');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取所有角色
router.get('/listAll', async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name'],
    });
    success(res, roles, '获取角色列表成功');
  } catch (error) {
    fail(res, '获取角色列表失败', 500);
  }
});

// 分页获取所有角色
router.get('/listPage', checkMenuPermission('角色管理','can_read'), async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
    fail(res, '获取角色列表失败', 500);
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
    success(res, role, '创建角色成功');
  } catch (error) {
    fail(res, '创建角色失败', 500);
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

// 导出角色
router.get('/export', checkMenuPermission('角色管理','can_read'), async (req, res) => {
  try {
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

  } catch (error) {
    console.error('导出角色失败:', error);
    fail(res, '导出角色失败', 500);
  }
});

module.exports = router;