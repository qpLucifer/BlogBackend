// routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkPermission, checkRole, checkMenuPermission } = require('../middleware/permissions');
const { User, Role, Menu, RoleMenu} = require('../models/admin');
const { hashPassword } = require('../utils/auth');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 导入验证和性能监控
const { validateInput } = require('../middleware/security');
const { userValidation, paginationValidation } = require('../utils/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { performanceMonitor } = require('../utils/performance');

// 需要认证
router.use(authenticate);

// 性能监控
router.use(performanceMonitor);

// 获取所有用户
router.get('/listAll', catchAsync(async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'username'],
  });

  success(res, users, '获取用户列表成功');
}));

// 获取所有用户
router.get('/listPage',checkMenuPermission('用户管理','can_read'), catchAsync(async (req, res) => {
  const { username, email, is_active, pageSize = 10, currentPage = 1 } = req.query;

  // 构建查询条件
  const whereConditions = {};
  if (username) {
    whereConditions.username = { [Op.like]: `%${username}%` };
  }
  if (email) {
    whereConditions.email = { [Op.like]: `%${email}%` };
  }
  if (is_active !== undefined && is_active !== '') {
    whereConditions.is_active = is_active;
  }

  // 获取总数
  const total = await User.count({ where: whereConditions });

  // 获取分页数据
  const users = await User.findAll({
    attributes: ['id', 'username', 'email', 'is_active', 'created_at'],
    include: [{
      model: Role,
      attributes: ['id', 'name'],
      through: { attributes: [] },
      as:"roles"
    }],
    where: whereConditions,
    limit: parseInt(pageSize),
    offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
    order: [['created_at', 'DESC']]
  });

  success(res, {
    list: users,
    total: total,
    pageSize: parseInt(pageSize),
    currentPage: parseInt(currentPage),
  }, '获取用户列表成功');
}));

// 新增用户
router.post('/users',
  checkMenuPermission('用户管理','can_create'),
  validateInput(userValidation.register),
  catchAsync(async (req, res) => {
    const { username, email, password, roles } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ username, email, password_hash: hashedPassword });
    if (roles) {
      await user.setRoles(roles);
    }
    success(res, user, '新增用户成功', 200);
  })
);

// 更新用户
router.put('/users/:id',
  checkMenuPermission('用户管理','can_update'),
  validateInput(userValidation.update),
  catchAsync(async (req, res) => {
    const { username, email, is_active, roles } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return fail(res, '用户不存在', 404);
    }
    await user.update({ username, email, is_active });
    if (roles) {
      await user.setRoles(roles);
    }
    success(res, user, '更新用户成功');
  })
);

// 更新用户个人信息
router.put('/users/:id/profile',checkMenuPermission('用户管理','can_update'), catchAsync(async (req, res) => {
  const { mood, signature } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return fail(res, '用户不存在', 404);
  }
  await user.update({ mood, signature });
  success(res, user, '更新用户个人信息成功');
}));

// 删除用户
router.delete('/users/:id',checkMenuPermission('用户管理','can_delete'), catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return fail(res, '用户不存在', 404);
  }
  await user.destroy();
  success(res, null, '用户删除成功');
}));

// 导出用户
router.get('/export', checkMenuPermission('用户管理','can_read'), catchAsync(async (req, res) => {
  const { username, email, is_active } = req.query;

  // 构建查询条件
  const whereConditions = {};
  if (username) {
    whereConditions.username = { [Op.like]: `%${username}%` };
  }
  if (email) {
    whereConditions.email = { [Op.like]: `%${email}%` };
  }
  if (is_active !== undefined) {
    whereConditions.is_active = is_active === 'true';
  }

  const users = await User.findAll({
    include: [{
      model: Role,
      attributes: ['name'],
      through: { attributes: [] },
      as: "roles"
    }],
    where: whereConditions,
    attributes: ['id', 'username', 'email', 'is_active', 'mood', 'signature', 'created_at'],
    order: [['id', 'ASC']]
  });

  // 设置响应头
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.xlsx`);

  // 构建Excel数据
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();

  const worksheetData = [
    ['ID', '用户名', '邮箱', '状态', '心情', '个性签名', '角色', '创建时间'], // 表头
    ...users.map(user => [
      user.id,
      user.username,
      user.email,
      user.is_active ? '激活' : '未激活',
      user.mood || '',
      user.signature || '',
      user.roles ? user.roles.map(role => role.name).join(', ') : '',
      new Date(user.created_at).toLocaleString('zh-CN')
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.send(buffer);
}));

module.exports = router;