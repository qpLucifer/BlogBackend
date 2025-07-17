const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Blog, Tag, BlogTag, Comment} = require('../models/blog');
const { User } = require('../models/admin');
const { success, fail } = require('../utils/response');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取所有博客
router.get('/list', checkMenuPermission('博客管理','can_read'), async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }]
    });
    let resBlogs = blogs;
    for (let i in resBlogs) {
      const user = await User.findByPk(blogs[i].author_id);
      resBlogs[i].author_id = user.username
    }
    res.json(resBlogs);
  } catch (error) {
    fail(res, '获取博客列表失败', 500);
  }
});

// 获取单篇博客
router.get('/:id', checkMenuPermission('博客管理','can_read'), async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id, {
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }]
    });
    if (!blog) {
      return fail(res, '博客不存在', 404);
    }
    success(res, blog, '获取博客成功');
  } catch (error) {
    fail(res, '获取博客失败', 500);
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
    success(res, blog, '新增博客成功', 201);
  } catch (error) {
    fail(res, '新增博客失败', 500);
  }
});

// 更新博客
router.put('/update/:id', checkMenuPermission('博客管理','can_update'), async (req, res) => {
  try {
    const { title, cover_image, content, summary, author_id, tags, is_published } = req.body;
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return fail(res, '博客不存在', 404);
    }
    await blog.update({ title, cover_image, content, summary, author_id, is_published });
    if (tags) {
      await blog.setTags(tags);
    }
    success(res, blog, '更新博客成功');
  } catch (error) {
    fail(res, '更新博客失败', 500);
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