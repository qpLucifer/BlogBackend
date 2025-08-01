// middleware/errorHandler.js - 统一错误处理
const SimpleLogger = require('../utils/logger');

// 资源不存在错误类 - 用于404处理
class NotFoundError extends Error {
  constructor(resource = '资源') {
    super(`${resource}不存在`);
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    this.isOperational = true;
  }
}



// 全局错误处理中间件
const globalErrorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  // 记录错误日志
  try {
    // 确定日志类型
    let logType = 'error';
    if (statusCode === 401 || statusCode === 403) {
      logType = 'security'; // 认证和授权错误
    } else if (statusCode === 404) {
      logType = 'operation'; // 资源不存在，通常是正常的业务操作
    }

    // 确定模块名称（从路径中提取）
    let module = 'unknown';
    if (req.originalUrl) {
      const pathParts = req.originalUrl.split('/');
      if (pathParts.length >= 3 && pathParts[1] === 'api') {
        module = pathParts[2]; // 例如 /api/users/123 -> users
      }
    }

    // 记录错误日志
    await SimpleLogger.logOperation(
      req.user?.id || null,
      req.user?.username || 'anonymous',
      'error',
      module,
      null,
      `${req.method} ${req.originalUrl}`,
      req.ip,
      req.get('User-Agent') || '',
      {
        error_message: message,
        status_code: statusCode,
        stack: err.stack,
        request_body: req.body,
        request_params: req.params,
        request_query: req.query
      },
      logType,
      'error'
    );
  } catch (logError) {
    // 如果日志记录失败，不要影响错误响应
    console.error('记录错误日志失败:', logError);
  }

  // 发送错误响应
  res.status(statusCode).json({
    code: statusCode,
    message: message,
    data: null
  });
};

// 异步错误捕获包装器
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404错误处理
const notFoundHandler = async (req, res, next) => {
  // 记录404错误日志
  try {
    await SimpleLogger.logOperation(
      req.user?.id || null,
      req.user?.username || 'anonymous',
      'error',
      'router',
      null,
      `${req.method} ${req.originalUrl}`,
      req.ip,
      req.get('User-Agent') || '',
      {
        error_type: '404_not_found',
        request_body: req.body,
        request_params: req.params,
        request_query: req.query
      },
      'operation', // 404通常是正常的操作错误
      'failed'
    );
  } catch (logError) {
    console.error('记录404日志失败:', logError);
  }

  const err = new NotFoundError(`路径 ${req.originalUrl}`);
  next(err);
};

// 注意：不要在这里添加全局的 uncaughtException 和 unhandledRejection 处理
// 这些会导致服务器在认证失败等正常错误时关闭
// 认证错误应该正常返回401给前端处理

module.exports = {
  NotFoundError,
  globalErrorHandler,
  catchAsync,
  notFoundHandler
};
