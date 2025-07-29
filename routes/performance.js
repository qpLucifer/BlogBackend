// routes/performance.js - 性能监控路由
const express = require('express');
const router = express.Router();
const os = require('os');
const { success, fail } = require('../utils/response');
const { catchAsync } = require('../middleware/errorHandler');
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { healthCheck, responseTimeTracker, systemMonitor, cacheMonitor } = require('../utils/performance');

// 需要认证
router.use(authenticate);

// 获取实时系统性能数据
router.get('/realtime',
  checkMenuPermission('性能监控', 'can_read'),
  catchAsync(async (req, res) => {
    const systemStats = systemMonitor.getSystemStats();
    const responseStats = responseTimeTracker.getAllStats();
    const cacheStats = cacheMonitor.getStats();
    
    // 获取更详细的系统信息
    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    
    const realtimeData = {
      timestamp: new Date().toISOString(),
      system: {
        ...systemStats,
        cpu: {
          count: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          usage: systemStats.cpu,
          loadAverage: os.loadavg()
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname()
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        env: process.env.NODE_ENV || 'development'
      },
      performance: {
        responseTime: responseStats,
        cache: cacheStats
      },
      health: healthCheck.getHealthStatus()
    };
    
    success(res, realtimeData, '获取实时性能数据成功');
  })
);

// 获取历史性能数据
router.get('/history',
  checkMenuPermission('性能监控', 'can_read'),
  catchAsync(async (req, res) => {
    const { hours = 24 } = req.query;
    
    // 这里应该从数据库或缓存中获取历史数据
    // 目前返回模拟数据，实际项目中需要实现数据持久化
    const now = new Date();
    const historyData = [];
    
    for (let i = parseInt(hours); i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      historyData.push({
        timestamp: timestamp.toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        responseTime: Math.random() * 1000 + 100,
        requests: Math.floor(Math.random() * 1000),
        errors: Math.floor(Math.random() * 10)
      });
    }
    
    success(res, {
      data: historyData,
      period: `${hours}小时`,
      total: historyData.length
    }, '获取历史性能数据成功');
  })
);

// 获取API响应时间统计
router.get('/api-stats',
  checkMenuPermission('性能监控', 'can_read'),
  catchAsync(async (req, res) => {
    const stats = responseTimeTracker.getAllStats();
    
    // 按路由分组统计
    const routeStats = {};
    Object.entries(stats).forEach(([endpoint, data]) => {
      const route = endpoint.split(' ')[1] || endpoint; // 提取路由部分
      if (!routeStats[route]) {
        routeStats[route] = {
          route,
          totalRequests: 0,
          avgResponseTime: 0,
          minResponseTime: Infinity,
          maxResponseTime: 0,
          totalTime: 0
        };
      }
      
      routeStats[route].totalRequests += data.count;
      routeStats[route].totalTime += data.total;
      routeStats[route].avgResponseTime = routeStats[route].totalTime / routeStats[route].totalRequests;
      routeStats[route].minResponseTime = Math.min(routeStats[route].minResponseTime, data.min);
      routeStats[route].maxResponseTime = Math.max(routeStats[route].maxResponseTime, data.max);
    });
    
    // 转换为数组并排序
    const sortedStats = Object.values(routeStats)
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .map(stat => ({
        ...stat,
        avgResponseTime: Math.round(stat.avgResponseTime * 100) / 100,
        minResponseTime: stat.minResponseTime === Infinity ? 0 : stat.minResponseTime,
        maxResponseTime: stat.maxResponseTime
      }));
    
    success(res, {
      routes: sortedStats,
      summary: {
        totalRoutes: sortedStats.length,
        totalRequests: sortedStats.reduce((sum, stat) => sum + stat.totalRequests, 0),
        avgResponseTime: sortedStats.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / sortedStats.length || 0
      }
    }, '获取API统计数据成功');
  })
);

// 获取错误统计
router.get('/errors',
  checkMenuPermission('性能监控', 'can_read'),
  catchAsync(async (req, res) => {
    // 这里应该从错误日志中统计数据
    // 目前返回模拟数据
    const errorStats = {
      total: Math.floor(Math.random() * 100),
      today: Math.floor(Math.random() * 20),
      thisWeek: Math.floor(Math.random() * 50),
      thisMonth: Math.floor(Math.random() * 200),
      byType: {
        '500': Math.floor(Math.random() * 30),
        '404': Math.floor(Math.random() * 40),
        '403': Math.floor(Math.random() * 15),
        '400': Math.floor(Math.random() * 25)
      },
      recentErrors: [
        {
          timestamp: new Date().toISOString(),
          type: '500',
          message: 'Internal Server Error',
          endpoint: '/api/blog/list',
          count: 1
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: '404',
          message: 'Not Found',
          endpoint: '/api/unknown',
          count: 3
        }
      ]
    };
    
    success(res, errorStats, '获取错误统计成功');
  })
);

// 获取缓存统计
router.get('/cache',
  checkMenuPermission('性能监控', 'can_read'),
  catchAsync(async (req, res) => {
    const cacheStats = cacheMonitor.getStats();
    
    const enhancedStats = {
      ...cacheStats,
      hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100 || 0,
      efficiency: {
        excellent: cacheStats.hitRate > 90,
        good: cacheStats.hitRate > 70,
        poor: cacheStats.hitRate < 50
      },
      recommendations: []
    };
    
    // 添加优化建议
    if (enhancedStats.hitRate < 50) {
      enhancedStats.recommendations.push('缓存命中率较低，建议检查缓存策略');
    }
    if (cacheStats.evictions > 100) {
      enhancedStats.recommendations.push('缓存淘汰次数较多，建议增加缓存容量');
    }
    
    success(res, enhancedStats, '获取缓存统计成功');
  })
);

// 重置性能统计数据
router.post('/reset',
  checkMenuPermission('性能监控', 'can_update'),
  catchAsync(async (req, res) => {
    const { type } = req.body;
    
    switch (type) {
      case 'response':
        responseTimeTracker.reset();
        break;
      case 'cache':
        cacheMonitor.reset();
        break;
      case 'all':
        responseTimeTracker.reset();
        cacheMonitor.reset();
        break;
      default:
        return fail(res, '无效的重置类型', 400);
    }
    
    success(res, null, `${type === 'all' ? '所有' : type}统计数据已重置`);
  })
);

// 获取系统资源使用趋势
router.get('/trends',
  checkMenuPermission('性能监控', 'can_read'),
  catchAsync(async (req, res) => {
    const { period = '1h' } = req.query;
    
    // 模拟趋势数据
    const intervals = period === '1h' ? 60 : period === '6h' ? 360 : 1440;
    const intervalMinutes = period === '1h' ? 1 : period === '6h' ? 1 : 1;
    
    const trends = [];
    const now = new Date();
    
    for (let i = intervals; i >= 0; i -= intervalMinutes) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      trends.push({
        timestamp: timestamp.toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: {
          in: Math.random() * 1000,
          out: Math.random() * 1000
        },
        requests: Math.floor(Math.random() * 100),
        responseTime: Math.random() * 500 + 50
      });
    }
    
    success(res, {
      period,
      data: trends,
      summary: {
        avgCpu: trends.reduce((sum, t) => sum + t.cpu, 0) / trends.length,
        avgMemory: trends.reduce((sum, t) => sum + t.memory, 0) / trends.length,
        avgResponseTime: trends.reduce((sum, t) => sum + t.responseTime, 0) / trends.length,
        totalRequests: trends.reduce((sum, t) => sum + t.requests, 0)
      }
    }, '获取系统资源趋势成功');
  })
);

module.exports = router;
