// routes/logs.js - 简化的日志管理路由
const express = require('express');
const router = express.Router();
const { success, fail } = require('../utils/response');
const { catchAsync } = require('../middleware/errorHandler');
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { UserLog } = require('../models/admin');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取操作日志列表
router.get('/list',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const {
      username,
      action,
      module,
      log_type,
      ip_address,
      status,
      start_date,
      end_date,
      pageSize = 20,
      currentPage = 1
    } = req.query;

    // 构建查询条件
    const whereConditions = {};
    
    if (username) {
      whereConditions.username = { [Op.like]: `%${username}%` };
    }
    
    if (action) {
      whereConditions.action = action;
    }
    
    if (module) {
      whereConditions.module = module;
    }

    if (log_type) {
      whereConditions.log_type = log_type;
    }
    
    if (ip_address) {
      whereConditions.ip_address = { [Op.like]: `%${ip_address}%` };
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (start_date && end_date) {
      whereConditions.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      whereConditions.created_at = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      whereConditions.created_at = {
        [Op.lte]: new Date(end_date)
      };
    }

    // 获取总数
    const total = await UserLog.count({ where: whereConditions });

    // 获取分页数据
    const logs = await UserLog.findAll({
      where: whereConditions,
      attributes: [
        'id', 'user_id', 'username', 'action', 'module', 'log_type',
        'target_id', 'target_name', 'ip_address', 'user_agent',
        'status', 'details', 'created_at'
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    success(res, {
      list: logs,
      total: total,
      pageSize: parseInt(pageSize),
      currentPage: parseInt(currentPage),
    }, '获取操作日志成功');
  })
);

// 获取日志统计信息
router.get('/stats',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    try {
      // 获取今日日志数量
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await UserLog.count({
        where: {
          created_at: {
            [Op.between]: [today, tomorrow]
          }
        }
      });

      // 获取各模块日志数量
      const moduleStats = await UserLog.findAll({
        attributes: [
          'module',
          [UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'count']
        ],
        group: ['module'],
        order: [[UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'DESC']]
      });

      // 获取各操作类型数量
      const actionStats = await UserLog.findAll({
        attributes: [
          'action',
          [UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'count']
        ],
        group: ['action'],
        order: [[UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'DESC']]
      });

      // 获取各日志类型数量
      const logTypeStats = await UserLog.findAll({
        attributes: [
          'log_type',
          [UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'count']
        ],
        group: ['log_type'],
        order: [[UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'DESC']]
      });

      // 获取最近7天的日志数量
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentCount = await UserLog.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo
          }
        }
      });

      success(res, {
        todayCount,
        recentCount,
        moduleStats,
        actionStats,
        logTypeStats
      }, '获取日志统计信息成功');
    } catch (error) {
      success(res, {
        todayCount: 0,
        recentCount: 0,
        moduleStats: [],
        actionStats: [],
        logTypeStats: []
      }, '获取日志统计信息失败，返回默认值');
    }
  })
);

// 清理日志
router.delete('/clean',
  checkMenuPermission('日志管理', 'can_delete'),
  catchAsync(async (req, res) => {
    const { days = 30 } = req.body;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      const result = await UserLog.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          }
        }
      });

      success(res, { deletedCount: result }, `清理了 ${result} 条过期日志记录`);
    } catch (error) {
      throw error;
    }
  })
);

// 导出日志
router.get('/export',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const {
      username,
      action,
      module,
      log_type,
      ip_address,
      status,
      start_date,
      end_date
    } = req.query;

    // 构建查询条件
    const whereConditions = {};
    
    if (username) {
      whereConditions.username = { [Op.like]: `%${username}%` };
    }
    
    if (action) {
      whereConditions.action = action;
    }
    
    if (module) {
      whereConditions.module = module;
    }

    if (log_type) {
      whereConditions.log_type = log_type;
    }

    if (ip_address) {
      whereConditions.ip_address = { [Op.like]: `%${ip_address}%` };
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (start_date && end_date) {
      whereConditions.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const logs = await UserLog.findAll({
      where: whereConditions,
      attributes: [
        'id', 'username', 'action', 'module', 'log_type',
        'target_name', 'ip_address', 'status', 'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: 10000 // 限制导出数量
    });

    // 转换为CSV格式
    const csvHeader = 'ID,用户名,操作,模块,日志类型,目标,IP地址,状态,时间\n';
    console.log(logs);
    const csvData = logs.map(log => {
      return [
        log.id,
        log.username || '',
        log.action,
        log.module,
        log.log_type,
        log.target_name || '',
        log.ip_address || '',
        log.status,
        log.created_at,
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\uFEFF' + csv); // 添加BOM以支持中文
  })
);

module.exports = router;
