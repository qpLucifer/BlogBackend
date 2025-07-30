// middleware/errorHandler.js - 统一错误处理

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
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
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
const notFoundHandler = (req, res, next) => {
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
