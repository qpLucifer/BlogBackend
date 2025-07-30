const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Blog, Tag, BlogTag, Comment} = require('../models/blog');
const { User } = require('../models/admin');
const { Op } = require("sequelize");
const { success, fail } = require('../utils/response');

// 导入验证和性能监控
const { blogValidation, paginationValidation } = require('../utils/validation');
const { catchAsync } = require('../middleware/errorHandler');

// 需要认证
router.use(authenticate);


// 获取所有博客列表
router.get('/listAll', catchAsync(async (req, res) => {
  const blogs = await Blog.findAll({
    attributes: ['id', 'title'],
  });
  success(res, blogs, '获取博客列表成功');
}));

// 分页获取所有博客
router.get('/listPage', checkMenuPermission('博客管理','can_read'), catchAsync(async (req, res) => {
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
}));

// 导出博客 - 必须在 /:id 路由之前
router.get('/export', checkMenuPermission('博客管理','can_read'), catchAsync(async (req, res) => {
  const { title, is_published, is_choice, author_id } = req.query;

  // 构建查询条件
  const whereConditions = {};
  if (title) {
    whereConditions.title = { [Op.like]: `%${title}%` };
  }
  if (is_published !== undefined) {
    whereConditions.is_published = is_published === 'true';
  }
  if (is_choice !== undefined) {
    whereConditions.is_choice = is_choice === 'true';
  }
  if (author_id) {
    whereConditions.author_id = author_id;
  }

  const blogs = await Blog.findAll({
    include: [
      {
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
        attributes: ['name']
      }
    ],
    where: whereConditions,
    attributes: ['id', 'title', 'summary', 'author_id', 'is_published', 'is_choice', 'need_time', 'created_at'],
    order: [['created_at', 'DESC']]
  });

  // 获取作者信息
  const blogsWithAuthor = await Promise.all(
    blogs.map(async (blog) => {
      const user = await User.findByPk(blog.author_id, { attributes: ['username'] });
      return {
        ...blog.toJSON(),
        author_name: user ? user.username : '未知用户'
      };
    })
  );

  // 设置响应头
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=blogs_${new Date().toISOString().split('T')[0]}.xlsx`);

  // 构建Excel数据
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();

  const worksheetData = [
    ['ID', '标题', '摘要', '作者', '是否发布', '是否精选', '阅读时长', '标签', '创建时间'], // 表头
    ...blogsWithAuthor.map(blog => [
      blog.id,
      blog.title,
      blog.summary || '',
      blog.author_name,
      blog.is_published ? '已发布' : '草稿',
      blog.is_choice ? '是' : '否',
      blog.need_time ? `${blog.need_time}分钟` : '',
      blog.tags ? blog.tags.map(tag => tag.name).join(', ') : '',
      new Date(blog.created_at).toLocaleString('zh-CN')
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '博客列表');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.send(buffer);
}));

// 获取单篇博客
router.get('/:id', checkMenuPermission('博客管理','can_read'), catchAsync(async (req, res) => {
  const blog = await Blog.findByPk(req.params.id, {
    include: [{ model: Tag, as: 'tags', through: { attributes: [] } }]
  });
  if (!blog) {
    return fail(res, '博客不存在', 404);
  }
  success(res, blog, '获取博客成功');
}));

// 新增博客
router.post('/add',
  checkMenuPermission('博客管理','can_create'),
  catchAsync(async (req, res) => {
    const { title, cover_image, content, summary, author_id, tags, is_published, is_choice, need_time } = req.body;
    const blog = await Blog.create({ title, cover_image, content, summary, author_id, is_published, is_choice, need_time });
    if (tags && tags.length > 0) {
      await blog.setTags(tags);
    }

    success(res, blog, '新增博客成功', 200);
  })
);

// 更新博客
router.put('/update/:id', checkMenuPermission('博客管理','can_update'), catchAsync(async (req, res) => {
  const { title, cover_image, content, summary, author_id, tags, is_published, is_choice, need_time } = req.body;

  const blog = await Blog.findByPk(req.params.id);
  if (!blog) {
    return fail(res, '博客不存在', 404);
  }

  const wasPublished = blog.is_published;
  await blog.update({ title, cover_image, content, summary, author_id, is_published, is_choice, need_time });
  if (tags) {
    await blog.setTags(tags);
  }

  success(res, blog, '更新博客成功');
}));

// 删除博客
router.delete('/delete/:id', checkMenuPermission('博客管理','can_delete'), catchAsync(async (req, res) => {
  const blog = await Blog.findByPk(req.params.id);
  if (!blog) {
    return fail(res, '博客不存在', 404);
  }
  await blog.destroy();
  success(res, null, '博客删除成功');
}));

module.exports = router;