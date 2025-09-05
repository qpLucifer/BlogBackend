const express = require('express');
const router = express.Router();
const { User, Blog, Comment, Tag, Role, Menu, UserLog } = require('../models');
const { success, error } = require('../utils/response');
const authenticate = require('../middleware/auth');
const { Op } = require('sequelize');
const moment = require('moment');
const os = require('os');
const fs = require('fs');

// 获取CPU使用率
const getCpuUsage = () => {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  return Math.round(100 - (100 * totalIdle / totalTick));
};

// 获取内存使用率
const getMemoryUsage = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return Math.round(((totalMem - freeMem) / totalMem) * 100);
};

// 获取磁盘使用率
const getDiskUsage = () => {
  try {
    // 这里简化处理，实际项目中可以使用第三方库如 'diskusage' 获取真实磁盘使用率
    // 暂时返回一个基于系统内存的估算值
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return Math.round(((totalMem - freeMem) / totalMem) * 100);
  } catch (err) {
    return 0;
  }
};

// 应用认证中间件
router.use(authenticate);

// 获取Dashboard统计数据
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query; // 支持 week, month, quarter
    const now = moment();
    const startOfToday = now.clone().startOf('day');

    // 基础统计数据
    const [
      totalUsers,
      totalBlogs,
      totalComments,
      totalTags
    ] = await Promise.all([
      User.count(),
      Blog.count(),
      Comment.count(),
      Tag.count()
    ]);

    // 今日新增数据
    const [
      todayNewUsers,
      todayNewBlogs,
      todayNewComments,
      todayNewTags,
      todayNewLogs
    ] = await Promise.all([
      User.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday.toDate()
          }
        }
      }),
      Blog.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday.toDate()
          }
        }
      }),
      Comment.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday.toDate()
          }
        }
      }),
      Tag.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday.toDate()
          }
        }
      }),
      UserLog.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday.toDate()
          }
        }
      })
    ]);

    // 获取最近7天的趋势数据
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = now.clone().subtract(i, 'days');
      const startOfDay = date.clone().startOf('day');
      const endOfDay = date.clone().endOf('day');

      const [users, blogs, comments, views] = await Promise.all([
        User.count({
          where: {
            created_at: {
              [Op.between]: [startOfDay.toDate(), endOfDay.toDate()]
            }
          }
        }),
        Blog.count({
          where: {
            created_at: {
              [Op.between]: [startOfDay.toDate(), endOfDay.toDate()]
            }
          }
        }),
        Comment.count({
          where: {
            created_at: {
              [Op.between]: [startOfDay.toDate(), endOfDay.toDate()]
            }
          }
        }),
        Blog.sum('views', {
          where: {
            created_at: {
              [Op.between]: [startOfDay.toDate(), endOfDay.toDate()]
            }
          }
        }) || 0
      ]);

      weeklyStats.push({
        date: date.format('MM-DD'),
        users,
        blogs,
        comments,
        views
      });
    }

    // 根据时间范围获取数据
    let timeRangeStats = {};
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = now.clone().startOf('week');
        break;
      case 'month':
        startDate = now.clone().startOf('month');
        break;
      case 'quarter':
        startDate = now.clone().startOf('quarter');
        break;
      default:
        startDate = now.clone().startOf('week');
    }
    
    const [timeRangeUsers, timeRangeBlogs, timeRangeComments, timeRangeViews] = await Promise.all([
      User.count({
        where: {
          created_at: {
            [Op.gte]: startDate.toDate()
          }
        }
      }),
      Blog.count({
        where: {
          created_at: {
            [Op.gte]: startDate.toDate()
          }
        }
      }),
      Comment.count({
        where: {
          created_at: {
            [Op.gte]: startDate.toDate()
          }
        }
      }),
      Blog.sum('views', {
        where: {
          created_at: {
            [Op.gte]: startDate.toDate()
          }
        }
      }) || 0
    ]);
    
    timeRangeStats = {
      users: timeRangeUsers,
      blogs: timeRangeBlogs,
      comments: timeRangeComments,
      views: timeRangeViews
    };

    // 获取热门博客排行
    const topBlogs = await Blog.findAll({
      attributes: ['id', 'title', 'views', 'likes', 'comments_count', 'created_at'],
      order: [['views', 'DESC']],
      limit: 10
    });

    // 获取热门标签 - 使用子查询避免关联问题
    const topTags = await Tag.findAll({
      attributes: [
        'id', 
        'name',
        [
          require('sequelize').literal(`(
            SELECT COUNT(*) FROM blog_article_tags WHERE blog_article_tags.tag_id = Tag.id
          )`),
          'blog_count'
        ]
      ],
      order: [
        [require('sequelize').literal('blog_count'), 'DESC']
      ],
      limit: 8
    });

    // 获取活跃用户排行 - 使用子查询避免关联问题
    const activeUsers = await User.findAll({
      attributes: [
        'id', 
        'username',
        [
          require('sequelize').literal(`(
            SELECT COUNT(*) FROM blog_articles WHERE blog_articles.author_id = User.id
          )`),
          'blog_count'
        ],
        [
          require('sequelize').literal(`(
            SELECT COUNT(*) FROM blog_comments WHERE blog_comments.user_id = User.id
          )`),
          'comment_count'
        ]
      ],
      order: [
        [require('sequelize').literal('blog_count'), 'DESC'],
        [require('sequelize').literal('comment_count'), 'DESC']
      ],
      limit: 10
    });

    // 获取最近活动
    const recentActivities = await UserLog.findAll({
      attributes: ['id', 'action', 'module', 'details', 'created_at', 'username'],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // 获取真实系统状态数据
    const systemStatus = {
      cpu: getCpuUsage(),
      memory: getMemoryUsage(),
      disk: getDiskUsage(),
      uptime: Math.floor(process.uptime()), // 真实系统运行时间
    };

    const dashboardData = {
      totalUsers,
      totalBlogs,
      totalComments,
      totalTags,
      todayNewUsers,
      todayNewBlogs,
      todayNewComments,
      todayNewTags,
      todayNewLogs,
      weeklyStats,
      // 当前时间范围数据
      timeRangeStats,
      // 当前选择的时间范围
      currentTimeRange: timeRange,
      topBlogs,
      topTags,
      activeUsers,
      systemStatus,
      recentActivities: recentActivities.map(log => ({
        id: log.id,
        type: log.module === 'user' ? 'user' : 
              log.module === 'blog' ? 'blog' : 
              log.module === 'comment' ? 'comment' : 'system',
        action: log.action,
        description: log.details,
        timestamp: log.created_at,
        user: log.username
      }))
    };

    success(res, dashboardData, '获取Dashboard统计数据成功');
  } catch (err) {
    console.error('获取Dashboard统计数据失败:', err);
    error(res, '获取Dashboard统计数据失败', 500);
  }
});

module.exports = router;
