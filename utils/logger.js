// utils/logger.js - 增强版日志系统
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 为不同类型的日志创建子目录
const logTypes = ['error', 'auth', 'business', 'system', 'api', 'security', 'database'];
logTypes.forEach(type => {
  const typeDir = path.join(logDir, type);
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
});

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (stack) {
      log += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// JSON格式用于文件存储
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 创建日志传输器的工厂函数
const createDailyRotateTransport = (type, level = 'info', filter = null) => {
  return new DailyRotateFile({
    filename: path.join(logDir, type, `${type}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // 保留30天
    level: level,
    format: jsonFormat,
    auditFile: path.join(logDir, type, `.${type}-audit.json`),
    createSymlink: true,
    symlinkName: `${type}-current.log`,
    ...(filter && { filter })
  });
};

// 创建主logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'blog-backend' },
  transports: [
    // 错误日志 - 按天分割
    createDailyRotateTransport('error', 'error'),

    // 系统日志 - 所有级别
    createDailyRotateTransport('system', 'info'),
  ]
});

// 创建专门的logger实例用于不同类型
const createSpecializedLogger = (type, level = 'info') => {
  return winston.createLogger({
    level: level,
    format: jsonFormat,
    defaultMeta: { service: 'blog-backend', type: type },
    transports: [
      createDailyRotateTransport(type, level),
      // 同时写入系统日志
      createDailyRotateTransport('system', 'info')
    ]
  });
};

// 创建各种类型的专用logger
const authLogger = createSpecializedLogger('auth', 'info');
const businessLogger = createSpecializedLogger('business', 'info');
const apiLogger = createSpecializedLogger('api', 'http');
const securityLogger = createSpecializedLogger('security', 'warn');
const databaseLogger = createSpecializedLogger('database', 'debug');

// 开发环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack, type }) => {
        let log = `${timestamp} [${level}]`;
        if (type) {
          log += ` [${type.toUpperCase()}]`;
        }
        log += `: ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      })
    )
  });

  // 为所有logger添加控制台输出
  logger.add(consoleTransport);
  authLogger.add(consoleTransport);
  businessLogger.add(consoleTransport);
  apiLogger.add(consoleTransport);
  securityLogger.add(consoleTransport);
  databaseLogger.add(consoleTransport);
}

// 增强的日志方法
const logMethods = {
  error: (message, meta = {}) => {
    logger.error(message, { ...meta, type: 'system' });
  },

  warn: (message, meta = {}) => {
    logger.warn(message, { ...meta, type: 'system' });
  },

  info: (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'system' });
  },

  http: (message, meta = {}) => {
    logger.http(message, { ...meta, type: 'system' });
  },

  debug: (message, meta = {}) => {
    logger.debug(message, { ...meta, type: 'system' });
  }
};

// 数据库操作日志方法
const dbLoggerMethods = {
  query: (sql, params = [], duration = 0) => {
    databaseLogger.debug('Database Query', {
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },

  error: (error, sql = '', params = []) => {
    databaseLogger.error('Database Error', {
      error: error.message,
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  },

  connection: (action, details = {}) => {
    databaseLogger.info(`Database ${action}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  },

  transaction: (action, details = {}) => {
    databaseLogger.info(`Transaction ${action}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

// 认证日志方法
const authLoggerMethods = {
  login: (username, ip, success = true, reason = '') => {
    const level = success ? 'info' : 'warn';
    const message = success ? 'User login successful' : 'User login failed';

    authLogger[level](message, {
      username,
      ip,
      success,
      reason,
      timestamp: new Date().toISOString(),
      userAgent: global.currentRequest?.get('User-Agent') || 'Unknown'
    });
  },

  logout: (username, ip) => {
    authLogger.info('User logout', {
      username,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  tokenError: (error, ip, token = '') => {
    authLogger.warn('Token validation failed', {
      error: error.message,
      ip,
      token: token.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
  },

  passwordChange: (username, ip, success = true) => {
    const level = success ? 'info' : 'warn';
    const message = success ? 'Password changed successfully' : 'Password change failed';

    authLogger[level](message, {
      username,
      ip,
      success,
      timestamp: new Date().toISOString()
    });
  },

  accountLocked: (username, ip, reason = '') => {
    authLogger.warn('Account locked', {
      username,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的info方法
  info: (message, meta = {}) => {
    authLogger.info(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的warn方法
  warn: (message, meta = {}) => {
    authLogger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的error方法
  error: (message, meta = {}) => {
    authLogger.error(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

// API访问日志方法
const apiLoggerMethods = {
  request: (req, res, duration) => {
    const { method, originalUrl, ip, user } = req;
    const { statusCode } = res;

    apiLogger.http('API Request', {
      method,
      url: originalUrl,
      ip,
      statusCode,
      duration: `${duration}ms`,
      userId: user?.id,
      username: user?.username,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown',
      contentLength: res.get('Content-Length') || 0
    });
  },

  error: (req, error) => {
    const { method, originalUrl, ip, user, body, query, params } = req;

    apiLogger.error('API Error', {
      method,
      url: originalUrl,
      ip,
      userId: user?.id,
      username: user?.username,
      error: error.message,
      stack: error.stack,
      body: JSON.stringify(body),
      query: JSON.stringify(query),
      params: JSON.stringify(params),
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown'
    });
  },

  slowRequest: (req, duration) => {
    const { method, originalUrl, ip, user } = req;

    apiLogger.warn('Slow API Request', {
      method,
      url: originalUrl,
      ip,
      duration: `${duration}ms`,
      userId: user?.id,
      username: user?.username,
      timestamp: new Date().toISOString()
    });
  }
};

// 安全日志方法
const securityLoggerMethods = {
  rateLimitExceeded: (ip, endpoint) => {
    securityLogger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    });
  },

  suspiciousActivity: (ip, activity, details = {}) => {
    securityLogger.warn('Suspicious activity detected', {
      ip,
      activity,
      ...details,
      timestamp: new Date().toISOString()
    });
  },

  fileUpload: (filename, size, mimetype, ip, userId) => {
    securityLogger.info('File uploaded', {
      filename,
      size,
      mimetype,
      ip,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  unauthorizedAccess: (ip, endpoint, userId = null) => {
    securityLogger.warn('Unauthorized access attempt', {
      ip,
      endpoint,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  dataExport: (userId, dataType, recordCount, ip) => {
    securityLogger.info('Data export', {
      userId,
      dataType,
      recordCount,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的info方法
  info: (message, meta = {}) => {
    securityLogger.info(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的warn方法
  warn: (message, meta = {}) => {
    securityLogger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的error方法
  error: (message, meta = {}) => {
    securityLogger.error(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

// 业务日志方法
const businessLoggerMethods = {
  userCreated: (userId, createdBy, ip) => {
    businessLogger.info('User created', {
      userId,
      createdBy,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  blogPublished: (blogId, authorId, title) => {
    businessLogger.info('Blog published', {
      blogId,
      authorId,
      title: title.substring(0, 50),
      timestamp: new Date().toISOString()
    });
  },

  roleAssigned: (userId, roleId, assignedBy) => {
    businessLogger.info('Role assigned', {
      userId,
      roleId,
      assignedBy,
      timestamp: new Date().toISOString()
    });
  },

  commentModerated: (commentId, action, moderatorId) => {
    businessLogger.info('Comment moderated', {
      commentId,
      action, // approved, rejected, deleted
      moderatorId,
      timestamp: new Date().toISOString()
    });
  },

  configChanged: (setting, oldValue, newValue, changedBy) => {
    businessLogger.info('Configuration changed', {
      setting,
      oldValue,
      newValue,
      changedBy,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的info方法
  info: (message, meta = {}) => {
    businessLogger.info(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的warn方法
  warn: (message, meta = {}) => {
    businessLogger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  // 通用的error方法
  error: (message, meta = {}) => {
    businessLogger.error(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

// Express中间件
const expressLogger = (req, res, next) => {
  const start = Date.now();

  // 存储请求信息以便在其他地方使用
  global.currentRequest = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    apiLoggerMethods.request(req, res, duration);

    // 记录慢请求
    if (duration > 5000) { // 超过5秒的请求
      apiLoggerMethods.slowRequest(req, duration);
    }
  });

  // 错误处理
  res.on('error', (error) => {
    apiLoggerMethods.error(req, error);
  });

  next();
};

// 日志清理工具
const logCleanup = {
  // 清理指定天数前的日志文件
  cleanOldLogs: async (days = 30) => {
    const fs = require('fs').promises;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let deletedCount = 0;

    for (const type of logTypes) {
      try {
        const typeDir = path.join(logDir, type);
        const files = await fs.readdir(typeDir);

        for (const file of files) {
          if (file.endsWith('.log') && !file.includes('current')) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);

            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedCount++;
              logger.info(`Deleted old log file: ${file}`, { type: 'system' });
            }
          }
        }
      } catch (error) {
        logger.error(`Error cleaning logs for type ${type}:`, { error: error.message, type: 'system' });
      }
    }

    return { deletedCount };
  },

  // 获取日志统计信息
  getLogStats: async () => {
    const fs = require('fs').promises;
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      recentLogs: []
    };

    for (const type of logTypes) {
      stats.fileTypes[type] = 0;

      try {
        const typeDir = path.join(logDir, type);
        const files = await fs.readdir(typeDir);

        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(typeDir, file);
            const fileStats = await fs.stat(filePath);

            stats.totalFiles++;
            stats.totalSize += fileStats.size;
            stats.fileTypes[type]++;

            stats.recentLogs.push({
              name: file,
              size: fileStats.size,
              modified: fileStats.mtime,
              type: type
            });
          }
        }
      } catch (error) {
        logger.error(`Error getting stats for type ${type}:`, { error: error.message, type: 'system' });
      }
    }

    // 按修改时间排序，取最近的10个
    stats.recentLogs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    stats.recentLogs = stats.recentLogs.slice(0, 10);

    return stats;
  }
};

module.exports = {
  // 主要logger实例
  logger,

  // 专用logger实例 - 保持原有的调用方式
  authLogger: authLoggerMethods,
  businessLogger: businessLoggerMethods,
  apiLogger: apiLoggerMethods,
  securityLogger: securityLoggerMethods,
  databaseLogger: dbLoggerMethods,

  // 简化的调用方式
  auth: authLoggerMethods,
  business: businessLoggerMethods,
  api: apiLoggerMethods,
  security: securityLoggerMethods,
  dbLogger: dbLoggerMethods,

  // 中间件和工具
  expressLogger,
  logCleanup,

  // 基础日志方法
  ...logMethods
};
