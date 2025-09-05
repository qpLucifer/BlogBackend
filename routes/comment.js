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

// 获取所有评论
router.get('/listAll', catchAsync(async (req, res) => {
  const { Comment } = require('../models');
  const comments = await Comment.findAll();
  success(res, comments, '获取评论列表成功');
}));

// 分页获取评论列表
router.get('/listPage', checkMenuPermission('评论管理','can_read'), catchAsync(async (req, res) => {
  const { Comment } = require('../models');
  const { content, user_id, blog_id, parent_id, pageSize = 10, currentPage = 1 } = req.query;

    // 调试日志
    console.log('分页查询参数:', { content, user_id, blog_id, parent_id, pageSize, currentPage });

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
    // 添加parent_id过滤支持
    if (parent_id !== undefined) {
      if (parent_id === 'main' || parent_id === 'null' || parent_id === null) {
        // 获取主评论（没有父评论的评论）
        whereConditions.parent_id = null;
      } else {
        // 获取指定父评论的回复
        whereConditions.parent_id = parseInt(parent_id);
      }
    }

    // 获取总数
    const total = await Comment.count({ where: whereConditions });

    // 获取分页数据
    let comments = await Comment.findAll({
      where: whereConditions,
      limit: parseInt(pageSize),
      offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    // 如果是获取主评论，添加回复数量统计（包括所有层级的回复）
    if (parent_id === 'main' || parent_id === 'null' || parent_id === null) {
      // 为了性能考虑，我们可以使用一个更简单的方法：
      // 获取所有评论，然后在内存中计算层级关系
      const allComments = await Comment.findAll({
        attributes: ['id', 'parent_id']
      });

      // 构建父子关系映射
      const childrenMap = {};
      allComments.forEach(comment => {
        if (comment.parent_id) {
          if (!childrenMap[comment.parent_id]) {
            childrenMap[comment.parent_id] = [];
          }
          childrenMap[comment.parent_id].push(comment.id);
        }
      });

      // 递归统计所有后代的函数
      const countAllDescendants = (commentId) => {
        const children = childrenMap[commentId] || [];
        let count = children.length;

        children.forEach(childId => {
          count += countAllDescendants(childId);
        });

        return count;
      };

      comments = comments.map(comment => {
        const replyCount = countAllDescendants(comment.id);
        return {
          ...comment.toJSON(),
          reply_count: replyCount
        };
      });
    }

    success(res, {
      list: comments,
      total: total,
      pageSize: parseInt(pageSize),
      currentPage: parseInt(currentPage),
    }, '获取评论列表成功');
}));

// 新增评论（受系统设置开关控制）
router.post('/add',
  (req, res, next) => {
    const { getSettings } = require('../utils/settings');
    if (!getSettings().validation.commentsEnabled) {
      return fail(res, '评论功能已关闭', 403);
    }
    next();
  },
  checkMenuPermission('评论管理','can_create'),
  (req, res, next) => {
    const { validateBody, commentValidation } = require('../utils/validation');
    return validateBody(commentValidation.create)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { blog_id, user_id, content, parent_id } = req.body;

    const { Comment } = require('../models');
    const comment = await Comment.create({ blog_id, user_id, content, parent_id });

    // 记录操作日志
    await SimpleLogger.logOperation(
      req.user.id,
      req.user.username,
      'create',
      'comment',
      comment.id,
      `评论ID:${comment.id}`,
      req.ip,
      req.get('User-Agent'),
      { blog_id, user_id, parent_id },
      'operation',
      'success'
    );

    // 推送待处理评论数量更新
    const wsManager = require('../utils/websocket');
    const pendingCount = await Comment.count({
      where: { is_replied: false }
    });
    wsManager.updatePendingComments(pendingCount);

    // 如果是回复评论，标记原评论为已回复
    if (parent_id) {
      await Comment.update(
        { is_replied: true },
        { where: { id: parent_id } }
      );
    }

    success(res, comment, '新增评论成功', 200);
  })
);

// 更新评论（受系统设置开关控制）
router.put('/update/:id',
  (req, res, next) => {
    const { getSettings } = require('../utils/settings');
    if (!getSettings().validation.commentsEnabled) {
      return fail(res, '评论功能已关闭', 403);
    }
    next();
  },
  checkMenuPermission('评论管理','can_update'),
  (req, res, next) => {
    const { validateBody, commentValidation } = require('../utils/validation');
    return validateBody(commentValidation.update)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { content } = req.body;
    const { Comment } = require('../models');
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return fail(res, '评论不存在', 404);
    }

    const oldContent = comment.content;
    await comment.update({ content });

    // 记录操作日志
    await SimpleLogger.logOperation(
      req.user.id,
      req.user.username,
      'update',
      'comment',
      comment.id,
      `评论ID:${comment.id}`,
      req.ip,
      req.get('User-Agent'),
      { old_content: oldContent, new_content: content }
    );

    success(res, comment, '更新评论成功');
  })
);

// 删除评论（受系统设置开关控制）
router.delete('/delete/:id',
  (req, res, next) => {
    const { getSettings } = require('../utils/settings');
    if (!getSettings().validation.commentsEnabled) {
      return fail(res, '评论功能已关闭', 403);
    }
    next();
  },
  checkMenuPermission('评论管理','can_delete'),
  catchAsync(async (req, res) => {
    const { Comment } = require('../models');
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return fail(res, '评论不存在', 404);
    }

    const commentInfo = {
      id: comment.id,
      blog_id: comment.blog_id,
      content: comment.content
    };

    await comment.destroy();

    // 记录操作日志
    await SimpleLogger.logOperation(
      req.user.id,
      req.user.username,
      'delete',
      'comment',
      req.params.id,
      `评论ID:${req.params.id}`,
      req.ip,
      req.get('User-Agent'),
      commentInfo
    );

    success(res, null, '评论删除成功');
  })
);

// 导出评论
router.get('/export', checkMenuPermission('评论管理','can_read'), catchAsync(async (req, res) => {
  const { content, user_id, blog_id, parent_id } = req.query;

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
  // 添加parent_id过滤支持
  if (parent_id !== undefined) {
    if (parent_id === 'main' || parent_id === 'null' || parent_id === null) {
      whereConditions.parent_id = null;
    } else {
      whereConditions.parent_id = parseInt(parent_id);
    }
  }

  const comments = await Comment.findAll({
    where: whereConditions,
    attributes: ['id', 'blog_id', 'user_id', 'content', 'parent_id', 'created_at'],
    order: [['created_at', 'DESC']]
  });

  // 设置响应头
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=comments_${new Date().toISOString().split('T')[0]}.xlsx`);

  // 构建Excel数据
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();

  const worksheetData = [
    ['ID', '博客ID', '用户ID', '评论内容', '父评论ID', '创建时间'], // 表头
    ...comments.map(comment => [
      comment.id,
      comment.blog_id,
      comment.user_id,
      comment.content,
      comment.parent_id || '',
      new Date(comment.created_at).toLocaleString('zh-CN')
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, '评论列表');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.send(buffer);
}));

// 获取待处理评论数量
router.get('/pending-count', 
  checkMenuPermission('评论管理','can_read'),
  catchAsync(async (req, res) => {
    const { Comment } = require('../models');
    
    const pendingCount = await Comment.count({
      where: { 
        is_replied: false
      }
    });

    success(res, { pendingCount }, '获取待处理评论数量成功');
  })
);

// 标记评论为已回复
router.put('/mark-replied/:id',
  checkMenuPermission('评论管理','can_update'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { Comment } = require('../models');

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return fail(res, '评论不存在', 404);
    }

    await Comment.update(
      { is_replied: true },
      { where: { id } }
    );

    // 记录操作日志
    await SimpleLogger.logOperation(
      req.user.id,
      req.user.username,
      'update',
      'comment',
      id,
      `标记评论ID:${id}为已回复`,
      req.ip,
      req.get('User-Agent'),
      { comment_id: id, is_replied: true },
      'operation',
      'success'
    );

    // 推送待处理评论数量更新
    const wsManager = require('../utils/websocket');
    const pendingCount = await Comment.count({
      where: { is_replied: false }
    });
    wsManager.updatePendingComments(pendingCount);

    success(res, { id, is_replied: true }, '标记评论为已回复成功');
  })
);

module.exports = router;