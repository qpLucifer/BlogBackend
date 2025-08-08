// middleware/security.js - 安全中间件（支持运行时更新）
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { getSettings } = require('../utils/settings');

// 创建速率限制器（根据当前设置）
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    handler: (req, res) => {
      res.status(429).json({ code: 429, message: `${message} (状态码: 429)`, data: null });
    },
    skipFailedRequests: false,
    headers: true,
  });
};

let _limiters = buildLimiters();

function buildLimiters() {
  const s = getSettings().rateLimit;
  return {
    loginLimiter: createRateLimiter(s.loginWindowMs, s.loginMax, '登录尝试次数过多，请15分钟后再试'),
    apiLimiter: createRateLimiter(s.windowMs, s.max, '请求频率过高，请稍后再试'),
    uploadLimiter: createRateLimiter(s.uploadWindowMs, s.uploadMax, '上传频率过高，请稍后再试'),
  };
}

function refreshLimiters() {
  _limiters = buildLimiters();
}

const { loginLimiter, apiLimiter, uploadLimiter } = _limiters;

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
  get loginLimiter() { return _limiters.loginLimiter; },
  get apiLimiter() { return _limiters.apiLimiter; },
  get uploadLimiter() { return _limiters.uploadLimiter; },
  refreshLimiters,
  helmetConfig,
  helmet,
};