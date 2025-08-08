// middleware/security.js - 安全中间件
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 创建速率限制器
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // 返回标准的 RateLimit 头
    legacyHeaders: false, // 禁用 X-RateLimit-* 头
    // 跳过预检请求，避免 CORS 预检被限流
    skip: (req, res) => req.method === 'OPTIONS',
    handler: (req, res) => {
      // 设置状态码为429并返回标准格式的错误信息
      res.status(429).json({
        code: 429,
        message: `${message} (状态码: 429)`,
        data: null
      });
    },
    // 确保即使客户端中断连接也能发送完整响应
    skipFailedRequests: false,
    // 确保响应头正确设置
    headers: true
  });
};

// 登录限制 - 15分钟内最多5次
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15分钟
  5, // 最多5次尝试
  '登录尝试次数过多，请15分钟后再试'
);

// API通用限制 - 15分钟内最多100次
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15分钟
  100, // 最多100次请求
  '请求频率过高，请稍后再试'
);

// 上传限制 - 1分钟内最多10次
const uploadLimiter = createRateLimiter(
  60 * 1000, // 1分钟
  10, // 最多10次上传
  '上传频率过高，请稍后再试'
);

// 配置Helmet安全头
const helmetConfig = {
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // 跨域资源策略
  crossOriginResourcePolicy: { policy: 'same-site' },
  // 跨域嵌入器策略
  crossOriginEmbedderPolicy: false, // 允许跨域资源加载
  // DNS预取控制
  dnsPrefetchControl: { allow: true },
  // 框架选项（防止点击劫持）
  frameguard: { action: 'sameorigin' },
  // 严格传输安全
  hsts: {
    maxAge: 15552000, // 180天
    includeSubDomains: true,
    preload: true,
  },
  // 禁止嗅探MIME类型
  noSniff: true,
  // 阻止XSS攻击
  xssFilter: true,
  // 引用策略
  referrerPolicy: { policy: 'same-origin' },
};

module.exports = {
  loginLimiter,
  apiLimiter,
  uploadLimiter,
  helmetConfig,
  helmet
};