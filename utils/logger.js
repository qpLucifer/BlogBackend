// utils/logger.js - 日志系统
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
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

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'blog-backend' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // 访问日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// 开发环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      })
    )
  }));
}

// 日志级别方法
const logMethods = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  http: (message, meta = {}) => {
    logger.http(message, meta);
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  }
};

// 数据库操作日志
const dbLogger = {
  query: (sql, params = [], duration = 0) => {
    logger.debug('Database Query', {
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      duration: `${duration}ms`,
      type: 'database'
    });
  },
  
  error: (error, sql = '', params = []) => {
    logger.error('Database Error', {
      error: error.message,
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      stack: error.stack,
      type: 'database'
    });
  },
  
  connection: (action, details = {}) => {
    logger.info(`Database ${action}`, {
      ...details,
      type: 'database'
    });
  }
};

// 认证日志
const authLogger = {
  login: (username, ip, success = true, reason = '') => {
    const level = success ? 'info' : 'warn';
    const message = success ? 'User login successful' : 'User login failed';
    
    logger[level](message, {
      username,
      ip,
      success,
      reason,
      type: 'auth'
    });
  },
  
  logout: (username, ip) => {
    logger.info('User logout', {
      username,
      ip,
      type: 'auth'
    });
  },
  
  tokenError: (error, ip, token = '') => {
    logger.warn('Token validation failed', {
      error: error.message,
      ip,
      token: token.substring(0, 20) + '...',
      type: 'auth'
    });
  }
};

// API访问日志
const apiLogger = {
  request: (req, res, duration) => {
    const { method, originalUrl, ip, user } = req;
    const { statusCode } = res;
    
    logger.http('API Request', {
      method,
      url: originalUrl,
      ip,
      statusCode,
      duration: `${duration}ms`,
      userId: user?.id,
      username: user?.username,
      type: 'api'
    });
  },
  
  error: (req, error) => {
    const { method, originalUrl, ip, user, body, query, params } = req;
    
    logger.error('API Error', {
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
      type: 'api'
    });
  }
};

// 安全日志
const securityLogger = {
  rateLimitExceeded: (ip, endpoint) => {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      type: 'security'
    });
  },
  
  suspiciousActivity: (ip, activity, details = {}) => {
    logger.warn('Suspicious activity detected', {
      ip,
      activity,
      ...details,
      type: 'security'
    });
  },
  
  fileUpload: (filename, size, mimetype, ip, userId) => {
    logger.info('File uploaded', {
      filename,
      size,
      mimetype,
      ip,
      userId,
      type: 'security'
    });
  }
};

// 业务日志
const businessLogger = {
  userCreated: (userId, createdBy, ip) => {
    logger.info('User created', {
      userId,
      createdBy,
      ip,
      type: 'business'
    });
  },
  
  blogPublished: (blogId, authorId, title) => {
    logger.info('Blog published', {
      blogId,
      authorId,
      title: title.substring(0, 50),
      type: 'business'
    });
  },
  
  roleAssigned: (userId, roleId, assignedBy) => {
    logger.info('Role assigned', {
      userId,
      roleId,
      assignedBy,
      type: 'business'
    });
  }
};

// Express中间件
const expressLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    apiLogger.request(req, res, duration);
  });
  
  next();
};

module.exports = {
  logger,
  dbLogger,
  authLogger,
  apiLogger,
  securityLogger,
  businessLogger,
  expressLogger,
  ...logMethods
};
