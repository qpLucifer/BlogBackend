const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Comment } = require('../models/blog');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取所有评论
router.get('/listAll', async (req, res) => {
  try {
    const comments = await Comment.findAll();
    success(res, comments, '获取评论列表成功');
  } catch (error) {
    fail(res, '获取评论列表失败', 500);
  }
});

// 分页获取评论列表
router.get('/listPage', checkMenuPermission('评论管理','can_read'), async (req, res) => {
  try {
    const { content, user_id, blog_id, pageSize = 10, currentPage = 1 } = req.query;

    // 构建查询条件
    const whereConditions = {};
    if (content) {
      whereConditions.content = { [Op.like]: `%${content}%` };
    }
    if (user_id) {
      whereConditions.user_id = user_id;
    }
    if (blog_id) {
      whereConditions.blog_id = blog_id;
    }

    // 获取总数
    const total = await Comment.count({ where: whereConditions });

    // 获取分页数据
    const comments = await Comment.findAll({
      where: whereConditions,
      limit: parseInt(pageSize),
      offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    success(res, {
      list: comments,
      total: total,
      pageSize: parseInt(pageSize),
      currentPage: parseInt(currentPage),
    }, '获取评论列表成功');
  } catch (error) {
    console.log(error);
    fail(res, '获取评论列表失败', 500);
  }
});

// 新增评论
router.post('/add', checkMenuPermission('评论管理','can_create'), async (req, res) => {
  try {
    const { blog_id, user_id, content, parent_id } = req.body;
    const comment = await Comment.create({ blog_id, user_id, content, parent_id });
    success(res, comment, '新增评论成功', 200);
  } catch (error) {
    fail(res, '新增评论失败', 500);
  }
});

// 更新评论
router.put('/update/:id', checkMenuPermission('评论管理','can_update'), async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }
    await comment.update({ content });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: '更新评论失败' });
  }
});

// 删除评论
router.delete('/delete/:id', checkMenuPermission('评论管理','can_delete'), async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }
    await comment.destroy();
    res.json({ message: '评论删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除评论失败' });
  }
});

module.exports = router; 