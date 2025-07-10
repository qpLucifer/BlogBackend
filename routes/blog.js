const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Blog, Tag, BlogTag, Comment } = require('../models/blog');

// 需要认证
router.use(authenticate);

// 获取所有博客
router.get('/list', checkMenuPermission('博客管理','can_read'), async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }]
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: '获取博客列表失败' });
  }
});

// 新增博客
router.post('/add', checkMenuPermission('博客管理','can_create'), async (req, res) => {
  try {
    const { title, cover_image, content, summary, author_id, tags, is_published } = req.body;
    const blog = await Blog.create({ title, cover_image, content, summary, author_id, is_published });
    if (tags && tags.length > 0) {
      await blog.setTags(tags);
    }
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: '新增博客失败' });
  }
});

// 更新博客
router.put('/update/:id', checkMenuPermission('博客管理','can_update'), async (req, res) => {
  try {
    const { title, cover_image, content, summary, author_id, tags, is_published } = req.body;
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: '博客不存在' });
    }
    await blog.update({ title, cover_image, content, summary, author_id, is_published });
    if (tags) {
      await blog.setTags(tags);
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: '更新博客失败' });
  }
});

// 删除博客
router.delete('/delete/:id', checkMenuPermission('博客管理','can_delete'), async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: '博客不存在' });
    }
    await blog.destroy();
    res.json({ message: '博客删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除博客失败' });
  }
});

module.exports = router; 