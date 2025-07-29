// middleware/security.js - 安全中间件
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { fail } = require('../utils/response');

// 请求频率限制
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = '请求过于频繁，请稍后再试') => {
  return rateLimit({
    windowMs,
    max,
    message: { code: 429, message, data: null },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      fail(res, message, 429);
    }
  });
};

// 登录频率限制 - 更严格
const loginRateLimit = createRateLimit(
  15 * 60 * 1000, // 15分钟
  5, // 最多5次尝试
  '登录尝试过于频繁，请15分钟后再试'
);

// API频率限制 - 一般
const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15分钟
  100, // 最多100次请求
  'API请求过于频繁，请稍后再试'
);

// 上传频率限制 - 严格
const uploadRateLimit = createRateLimit(
  60 * 1000, // 1分钟
  10, // 最多10次上传
  '上传过于频繁，请稍后再试'
);

// 输入验证中间件
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }
    next();
  };
};

// SQL注入防护
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // 移除潜在的SQL注入字符
      return obj.replace(/['"\\;]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize({ ...req.body });
  }
  if (req.query) {
    req.query = sanitize({ ...req.query });
  }
  if (req.params) {
    req.params = sanitize({ ...req.params });
  }

  next();
};

// XSS防护
const xssProtection = (req, res, next) => {
  const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return escapeHtml(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject({ ...req.body });
  }

  next();
};

// 文件上传安全检查
const fileUploadSecurity = (req, res, next) => {
  if (req.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      return fail(res, '不支持的文件类型', 400);
    }

    if (req.file.size > maxSize) {
      return fail(res, '文件大小超过限制(5MB)', 400);
    }

    // 检查文件名
    const filename = req.file.originalname;
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return fail(res, '文件名包含非法字符', 400);
    }
  }

  next();
};

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 记录请求信息
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // 记录响应时间
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️  ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Helmet安全头配置
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

module.exports = {
  loginRateLimit,
  apiRateLimit,
  uploadRateLimit,
  validateInput,
  sanitizeInput,
  xssProtection,
  fileUploadSecurity,
  requestLogger,
  securityHeaders,
  createRateLimit
};
