const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Blog, Tag, BlogTag, Comment} = require('../models/blog');
const { User } = require('../models/admin');
const { Op } = require("sequelize");
const { success, fail } = require('../utils/response');

// 需要认证
router.use(authenticate);

// 获取所有博客列表
router.get('/listAll', async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      attributes: ['id', 'title'],
    });
    success(res, blogs, '获取博客列表成功');
  } catch (error) {
    fail(res, '获取博客列表失败', 500);
  }
});

// 分页获取所有博客
router.get('/listPage', checkMenuPermission('博客管理','can_read'), async (req, res) => {
  try {
    const { title, is_published, is_choice, author_id, pageSize, currentPage } = req.query;
    const titleQuery = title ? { title: { [Op.like]: `%${title}%` } } : {};
    const is_publishedQuery = is_published ? { is_published: is_published } : {};
    const is_choiceQuery = is_choice ? { is_choice: is_choice } : {};
    const author_idQuery = author_id ? { author_id: author_id } : {};
    // 获取总数
    const total = await Blog.count({
      where: {    
        [Op.and]: [
          titleQuery,
          is_publishedQuery,
          is_choiceQuery,
          author_idQuery,
        ]
      }
    }); 
    const blogs = await Blog.findAll({
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
      where: {
        [Op.and]: [
          titleQuery,
          is_publishedQuery,
          is_choiceQuery,
          author_idQuery,
        ]
      },
      limit: pageSize*1,
      offset: (currentPage*1 - 1) * pageSize*1,
    });
    let resBlogs = blogs;
    for (let i in resBlogs) {
      const user = await User.findByPk(blogs[i].author_id);
      resBlogs[i].author_id = user.username
    }
    success(res, {
      list: resBlogs,
      total: total, 
      pageSize: pageSize*1,
      currentPage: currentPage*1,
    }, '获取博客列表成功');
  } catch (error) {
    console.log(error);
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
    const { title, cover_image, content, summary, author_id, tags, is_published, is_choice, need_time } = req.body;
    const blog = await Blog.create({ title, cover_image, content, summary, author_id, is_published, is_choice, need_time });
    if (tags && tags.length > 0) {
      await blog.setTags(tags);
    }
    success(res, blog, '新增博客成功', 200);
  } catch (error) {
    fail(res, '新增博客失败', 500);
  }
});

// 更新博客
router.put('/update/:id', checkMenuPermission('博客管理','can_update'), async (req, res) => {
  try {
    const { title, cover_image, content, summary, author_id, tags, is_published, is_choice, need_time } = req.body;

    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return fail(res, '博客不存在', 404);
    }
    await blog.update({ title, cover_image, content, summary, author_id, is_published, is_choice, need_time });
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