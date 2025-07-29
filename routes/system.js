// routes/system.js - 系统监控和健康检查路由
const express = require('express');
const router = express.Router();
const { success, fail } = require('../utils/response');
const { healthCheck, responseTimeTracker, systemMonitor, cacheMonitor } = require('../utils/performance');
const { catchAsync } = require('../middleware/errorHandler');
const authenticate = require('../middleware/auth');
const { checkRole } = require('../middleware/permissions');

// 健康检查端点 - 公开访问
router.get('/health', catchAsync(async (req, res) => {
  const healthStatus = healthCheck.getHealthStatus();
  
  if (healthStatus.status === 'critical') {
    return res.status(503).json(healthStatus);
  }
  
  success(res, healthStatus, '系统健康检查');
}));

// 系统状态 - 需要管理员权限
router.get('/status', 
  authenticate,
  checkRole('admin'),
  catchAsync(async (req, res) => {
    const systemStats = systemMonitor.getSystemStats();
    const responseStats = responseTimeTracker.getAllStats();
    const cacheStats = cacheMonitor.getStats();
    
    const status = {
      system: systemStats,
      performance: {
        responseTime: responseStats,
        cache: cacheStats
      },
      timestamp: new Date().toISOString()
    };
    
    success(res, status, '系统状态信息');
  })
);

// 性能统计 - 需要管理员权限
router.get('/stats', 
  authenticate,
  checkRole('admin'),
  catchAsync(async (req, res) => {
    const stats = {
      responseTime: responseTimeTracker.getAllStats(),
      cache: cacheMonitor.getStats(),
      system: systemMonitor.getSystemStats(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    success(res, stats, '性能统计信息');
  })
);

// 重置统计数据 - 需要管理员权限
router.post('/stats/reset',
  authenticate,
  checkRole('admin'),
  catchAsync(async (req, res) => {
    responseTimeTracker.reset();
    cacheMonitor.reset();
    
    success(res, null, '统计数据已重置');
  })
);

// 系统信息 - 需要管理员权限
router.get('/info',
  authenticate,
  checkRole('admin'),
  catchAsync(async (req, res) => {
    const info = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    
    success(res, info, '系统信息');
  })
);

module.exports = router;
