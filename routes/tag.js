const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Tag } = require('../models/blog');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取所有标签列表
router.get('/listAll', async (req, res) => {
  try {
    const tags = await Tag.findAll({
      attributes: ['id', 'name'],
    });
    success(res, tags, '获取标签列表成功');
  } catch (error) {
    fail(res, '获取标签列表失败', 500);
  }
});


// 分页获取所有标签
router.get('/listPage', checkMenuPermission('标签管理','can_read'), async (req, res) => {
  try {
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
  } catch (error) {
    fail(res, '获取标签列表失败', 500);
  }
});

// 新增标签
router.post('/add', checkMenuPermission('标签管理','can_create'), async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.create({ name });
    success(res, tag, '新增标签成功', 200);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return fail(res, '标签已存在', 400);
    }
    fail(res, '新增标签失败', 500);
  }
});

// 更新标签
router.put('/update/:id', checkMenuPermission('标签管理','can_update'), async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: '标签不存在' });
    }
    await tag.update({ name });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: '更新标签失败' });
  }
});

// 删除标签
router.delete('/delete/:id', checkMenuPermission('标签管理','can_delete'), async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: '标签不存在' });
    }
    await tag.destroy();
    res.json({ message: '标签删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除标签失败' });
  }
});

module.exports = router; 