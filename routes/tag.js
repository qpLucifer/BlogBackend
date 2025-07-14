const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Tag } = require('../models/blog');

// 需要认证
router.use(authenticate);

// 获取所有标签
router.get('/list', checkMenuPermission('标签管理','can_read'), async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: '获取标签列表失败' });
  }
});

// 新增标签
router.post('/add', checkMenuPermission('标签管理','can_create'), async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await Tag.create({ name });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: '新增标签失败' });
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