// middleware/securityLogger.js - 安全日志中间件
const { security } = require('../utils/logger');

// 记录文件上传日志
const logFileUpload = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // 如果是成功的文件上传响应
    if (res.statusCode === 200 && req.file) {
      security.fileUpload(
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        req.ip,
        req.user?.id
      );
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// 记录未授权访问尝试
const logUnauthorizedAccess = (req, res, next) => {
  const originalStatus = res.status;
  
  res.status = function(code) {
    if (code === 401 || code === 403) {
      security.unauthorizedAccess(
        req.ip,
        req.originalUrl,
        req.user?.id
      );
    }
    
    return originalStatus.call(this, code);
  };
  
  next();
};

// 记录可疑活动
const logSuspiciousActivity = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip;
  
  // 检测可疑的User-Agent
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !req.originalUrl.includes('/api/logs')) {
    security.suspiciousActivity(ip, 'Suspicious User-Agent', {
      userAgent,
      endpoint: req.originalUrl,
      method: req.method
    });
  }
  
  // 检测快速连续请求（简单的频率限制检测）
  const requestKey = `${ip}_${req.originalUrl}`;
  const now = Date.now();
  
  if (!global.requestTracker) {
    global.requestTracker = new Map();
  }
  
  const lastRequest = global.requestTracker.get(requestKey);
  if (lastRequest && (now - lastRequest) < 100) { // 100ms内的重复请求
    security.suspiciousActivity(ip, 'Rapid requests', {
      endpoint: req.originalUrl,
      method: req.method,
      interval: now - lastRequest
    });
  }
  
  global.requestTracker.set(requestKey, now);
  
  // 清理旧的请求记录（每1000个请求清理一次）
  if (global.requestTracker.size > 1000) {
    const cutoff = now - 60000; // 1分钟前
    for (const [key, timestamp] of global.requestTracker.entries()) {
      if (timestamp < cutoff) {
        global.requestTracker.delete(key);
      }
    }
  }
  
  next();
};

// 记录数据导出操作
const logDataExport = (dataType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode === 200) {
        let recordCount = 0;
        
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          if (parsedData && parsedData.data && Array.isArray(parsedData.data)) {
            recordCount = parsedData.data.length;
          } else if (Array.isArray(parsedData)) {
            recordCount = parsedData.length;
          }
        } catch (error) {
          // 如果解析失败，记录为1条记录
          recordCount = 1;
        }
        
        security.dataExport(
          req.user?.id,
          dataType,
          recordCount,
          req.ip
        );
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// 记录敏感操作
const logSensitiveOperation = (operation) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode === 200) {
        security.info(`Sensitive operation: ${operation}`, {
          userId: req.user?.id,
          ip: req.ip,
          endpoint: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString()
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logFileUpload,
  logUnauthorizedAccess,
  logSuspiciousActivity,
  logDataExport,
  logSensitiveOperation
};
