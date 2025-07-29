// utils/performance.js - 性能监控工具
const { info, warn } = require('./logger');

// 性能监控中间件
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // 监控内存使用
  const memBefore = process.memoryUsage();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // 转换为毫秒
    
    const memAfter = process.memoryUsage();
    const memDiff = {
      rss: memAfter.rss - memBefore.rss,
      heapUsed: memAfter.heapUsed - memBefore.heapUsed,
      heapTotal: memAfter.heapTotal - memBefore.heapTotal,
      external: memAfter.external - memBefore.external
    };
    
    // 记录性能数据
    const perfData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryDiff: {
        rss: `${(memDiff.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(memDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`
      },
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    // 慢请求警告
    if (duration > 1000) {
      warn('Slow request detected', perfData);
    } else if (duration > 500) {
      info('Medium duration request', perfData);
    }
    
    // 内存使用警告
    if (memDiff.heapUsed > 50 * 1024 * 1024) { // 50MB
      warn('High memory usage detected', perfData);
    }
  });
  
  next();
};

// 数据库查询性能监控
const dbPerformanceMonitor = {
  logQuery: (sql, duration, params = []) => {
    const perfData = {
      sql: sql.replace(/\s+/g, ' ').trim(),
      duration: `${duration}ms`,
      params: params.length > 0 ? params : undefined,
      type: 'database'
    };
    
    if (duration > 1000) {
      warn('Slow database query', perfData);
    } else if (duration > 500) {
      info('Medium duration database query', perfData);
    }
  }
};

// 系统资源监控
const systemMonitor = {
  // 获取系统状态
  getSystemStats: () => {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    return {
      memory: {
        rss: `${(mem.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(mem.external / 1024 / 1024).toFixed(2)}MB`
      },
      cpu: {
        user: cpu.user,
        system: cpu.system
      },
      uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
      pid: process.pid,
      version: process.version,
      platform: process.platform
    };
  },
  
  // 定期监控
  startMonitoring: (intervalMs = 60000) => {
    setInterval(() => {
      const stats = systemMonitor.getSystemStats();
      
      // 检查内存使用
      const heapUsed = parseFloat(stats.memory.heapUsed);
      if (heapUsed > 500) { // 500MB
        warn('High memory usage detected', stats);
      }
      
      info('System stats', stats);
    }, intervalMs);
  }
};

// API响应时间统计
class ResponseTimeTracker {
  constructor() {
    this.stats = new Map();
  }
  
  record(endpoint, duration) {
    if (!this.stats.has(endpoint)) {
      this.stats.set(endpoint, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      });
    }
    
    const stat = this.stats.get(endpoint);
    stat.count++;
    stat.totalTime += duration;
    stat.minTime = Math.min(stat.minTime, duration);
    stat.maxTime = Math.max(stat.maxTime, duration);
    stat.avgTime = stat.totalTime / stat.count;
  }
  
  getStats(endpoint) {
    return this.stats.get(endpoint) || null;
  }
  
  getAllStats() {
    const result = {};
    for (const [endpoint, stats] of this.stats) {
      result[endpoint] = {
        ...stats,
        avgTime: `${stats.avgTime.toFixed(2)}ms`,
        minTime: `${stats.minTime.toFixed(2)}ms`,
        maxTime: `${stats.maxTime.toFixed(2)}ms`
      };
    }
    return result;
  }
  
  reset() {
    this.stats.clear();
  }
}

// 全局响应时间跟踪器
const responseTimeTracker = new ResponseTimeTracker();

// 响应时间跟踪中间件
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const endpoint = `${req.method} ${req.route?.path || req.originalUrl}`;
    responseTimeTracker.record(endpoint, duration);
  });
  
  next();
};

// 健康检查端点数据
const healthCheck = {
  getHealthStatus: () => {
    const stats = systemMonitor.getSystemStats();
    const heapUsed = parseFloat(stats.memory.heapUsed);
    const uptime = parseFloat(stats.uptime);
    
    let status = 'healthy';
    const issues = [];
    
    // 检查内存使用
    if (heapUsed > 800) {
      status = 'critical';
      issues.push('High memory usage');
    } else if (heapUsed > 500) {
      status = 'warning';
      issues.push('Elevated memory usage');
    }
    
    // 检查运行时间
    if (uptime < 1) {
      status = 'warning';
      issues.push('Recently restarted');
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: stats.uptime,
      memory: stats.memory,
      issues: issues.length > 0 ? issues : undefined,
      version: process.env.npm_package_version || '1.0.0'
    };
  }
};

// 缓存性能监控
const cacheMonitor = {
  hits: 0,
  misses: 0,
  
  recordHit: () => {
    cacheMonitor.hits++;
  },
  
  recordMiss: () => {
    cacheMonitor.misses++;
  },
  
  getStats: () => {
    const total = cacheMonitor.hits + cacheMonitor.misses;
    return {
      hits: cacheMonitor.hits,
      misses: cacheMonitor.misses,
      total,
      hitRate: total > 0 ? `${((cacheMonitor.hits / total) * 100).toFixed(2)}%` : '0%'
    };
  },
  
  reset: () => {
    cacheMonitor.hits = 0;
    cacheMonitor.misses = 0;
  }
};

module.exports = {
  performanceMonitor,
  dbPerformanceMonitor,
  systemMonitor,
  ResponseTimeTracker,
  responseTimeTracker,
  responseTimeMiddleware,
  healthCheck,
  cacheMonitor
};
