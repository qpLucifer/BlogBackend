const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Comment } = require('../models/blog');

// 需要认证
router.use(authenticate);

// 获取所有评论
router.get('/comments', checkMenuPermission('评论管理','can_read'), async (req, res) => {
  try {
    const comments = await Comment.findAll();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: '获取评论列表失败' });
  }
});

// 新增评论
router.post('/comments', checkMenuPermission('评论管理','can_create'), async (req, res) => {
  try {
    const { blog_id, user_id, content, parent_id } = req.body;
    const comment = await Comment.create({ blog_id, user_id, content, parent_id });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: '新增评论失败' });
  }
});

// 更新评论
router.put('/comments/:id', checkMenuPermission('评论管理','can_update'), async (req, res) => {
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
router.delete('/comments/:id', checkMenuPermission('评论管理','can_delete'), async (req, res) => {
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