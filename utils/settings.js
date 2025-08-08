// utils/settings.js - 运行时系统设置（内存持久）
require('dotenv').config();

const DEFAULTS = {
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    loginWindowMs: 15 * 60 * 1000,
    loginMax: 5,
    uploadWindowMs: 60 * 1000,
    uploadMax: 10,
  },
  validation: {
    usernameMin: 3,
    usernameMax: 16,
    passwordMin: 6,
    passwordMax: 20,
    enforceStrongPassword: true, // 是否启用强密码（大小写+数字）
    uploadEnabled: true, // 上传模块验证/开关
  },
  security: {
    corsOrigins: (process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : ['http://localhost:3001','http://localhost:3000']),
    helmetEnabled: true,
    logLevel: 'info', // error|warn|info|debug
  }
};

let settings = JSON.parse(JSON.stringify(DEFAULTS));

function getSettings() {
  return settings;
}

function updateSettings(partial) {
  // 浅合并 rateLimit/validation/security
  if (partial && typeof partial === 'object') {
    if (partial.rateLimit) {
      settings.rateLimit = { ...settings.rateLimit, ...sanitizeRateLimit(partial.rateLimit) };
    }
    if (partial.validation) {
      settings.validation = { ...settings.validation, ...sanitizeValidation(partial.validation) };
    }
    if (partial.security) {
      settings.security = { ...settings.security, ...sanitizeSecurity(partial.security) };
    }
  }
  return settings;
}

function sanitizeRateLimit(input) {
  const out = {};
  const keys = ['windowMs', 'max', 'loginWindowMs', 'loginMax', 'uploadWindowMs', 'uploadMax'];
  keys.forEach(k => {
    if (typeof input[k] !== 'undefined') {
      const v = parseInt(input[k], 10);
      if (!Number.isNaN(v) && v >= 0) out[k] = v;
    }
  });
  return out;
}

function sanitizeValidation(input) {
  const out = {};
  const intKeys = ['usernameMin', 'usernameMax', 'passwordMin', 'passwordMax'];
  intKeys.forEach(k => {
    if (typeof input[k] !== 'undefined') {
      const v = parseInt(input[k], 10);
      if (!Number.isNaN(v) && v >= 0) out[k] = v;
    }
  });
  if (typeof input.enforceStrongPassword !== 'undefined') {
    out.enforceStrongPassword = !!input.enforceStrongPassword;
  }
  if (typeof input.uploadEnabled !== 'undefined') {
    out.uploadEnabled = !!input.uploadEnabled;
  }
  return out;
}

function sanitizeSecurity(input) {
  const out = {};
  if (Array.isArray(input.corsOrigins)) {
    out.corsOrigins = input.corsOrigins.filter(Boolean);
  }
  if (typeof input.helmetEnabled !== 'undefined') {
    out.helmetEnabled = !!input.helmetEnabled;
  }
  if (typeof input.logLevel === 'string') {
    out.logLevel = input.logLevel;
  }
  return out;
}

module.exports = {
  getSettings,
  updateSettings,
  DEFAULTS,
};

