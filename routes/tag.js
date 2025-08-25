const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
// 动态导入模型以避免循环依赖
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');
const { catchAsync } = require('../middleware/errorHandler');
const SimpleLogger = require('../utils/logger');

// 需要认证
router.use(authenticate);

// 获取所有标签列表
router.get('/listAll', catchAsync(async (req, res) => {
  const { Tag } = require('../models');
    const tags = await Tag.findAll({
    attributes: ['id', 'name'],
  });
  success(res, tags, '获取标签列表成功');
}));

// 分页获取所有标签
router.get('/listPage', checkMenuPermission('标签管理','can_read'), catchAsync(async (req, res) => {
  const { Tag } = require('../models');
  const { name, pageSize, currentPage } = req.query;
  // 获取总数
  const total = await Tag.count({
    where: {
      name: {
        [Op.like]: `%${name}%`
      }
    }
  });
  const tags = await Tag.findAll({
    where: {
      name: {
        [Op.like]: `%${name}%`
      }
    },
    limit: pageSize*1,
    offset: (currentPage*1 - 1) * pageSize*1,
  });
  success(res, {
    list: tags,
    total: total,
    pageSize: pageSize*1,
    currentPage: currentPage*1,
  }, '获取标签列表成功');
}));

// 新增标签
router.post('/add',
  checkMenuPermission('标签管理','can_create'),
  (req, res, next) => {
    const { validateBody, tagValidation } = require('../utils/validation');
    return validateBody(tagValidation.create)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { name } = req.body;
    try {
      const { Tag } = require('../models');
    const tag = await Tag.create({ name });

      // 记录操作日志
      await SimpleLogger.logOperation(
        req.user.id,
        req.user.username,
        'create',
        'tag',
        tag.id,
        tag.name,
        req.ip,
        req.get('User-Agent'),
        { tag_name: name },
        'operation',
        'success'
      );

      success(res, tag, '新增标签成功', 200);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        // 记录操作日志
        await SimpleLogger.logOperation(
          req.user.id,
          req.user.username,
          'create',
          'tag',
          null,
          name,
          req.ip,
          req.get('User-Agent'),
          {
            error_type: 'unique_constraint',
            error_message: '标签名称已存在',
            tag_name: name
          },
          'error',
          'failed'
        );
        return fail(res, '标签已存在', 400);
      }
      throw error; // 让catchAsync处理其他错误
    }
  })
);

// 更新标签
router.put('/update/:id',
  checkMenuPermission('标签管理','can_update'),
  (req, res, next) => {
    const { validateBody, tagValidation } = require('../utils/validation');
    return validateBody(tagValidation.update)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { name } = req.body;
    const { Tag } = require('../models');
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return fail(res, '标签不存在', 404);
    }

    const oldName = tag.name;
    await tag.update({ name });

    // 记录操作日志
    await SimpleLogger.logOperation(
      req.user.id,
      req.user.username,
      'update',
      'tag',
      tag.id,
      tag.name,
      req.ip,
      req.get('User-Agent'),
      { old_name: oldName, new_name: name },
      'operation'
    );

    success(res, tag, '更新标签成功');
  })
);

// 删除标签
router.delete('/delete/:id', checkMenuPermission('标签管理','can_delete'), catchAsync(async (req, res) => {
  const tag = await Tag.findByPk(req.params.id);
  if (!tag) {
    return fail(res, '标签不存在', 404);
  }

  const tagName = tag.name;
  const { Tag } = require('../models');
    await tag.destroy();

  // 记录操作日志
  await SimpleLogger.logOperation(
    req.user.id,
    req.user.username,
    'delete',
    'tag',
    req.params.id,
    tagName,
    req.ip,
    req.get('User-Agent'),
    { deleted_name: tagName },
    'operation'
  );

  success(res, null, '标签删除成功');
}));

// 导出标签
router.get('/export', checkMenuPermission('标签管理','can_read'), async (req, res) => {
  try {
    const { name } = req.query;
    
    // 构建查询条件
    const whereConditions = {};
    if (name) {
      whereConditions.name = {
        [Op.like]: `%${name}%`
      };
    }

    const tags = await Tag.findAll({
      where: whereConditions,
      attributes: ['id', 'name', 'createdAt'],
      order: [['id', 'ASC']]
    });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=tags_${new Date().toISOString().split('T')[0]}.xlsx`);

    // 构建Excel数据
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['ID', '标签名', '创建时间'], // 表头
      ...tags.map(tag => [
        tag.id,
        tag.name,
        new Date(tag.createdAt).toLocaleString('zh-CN')
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '标签列表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);

  } catch (error) {
    console.error('导出标签失败:', error);
    fail(res, '导出标签失败', 500);
  }
});

module.exports = router; 
