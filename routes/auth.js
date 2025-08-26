// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../utils/auth');
const { success, fail } = require('../utils/response');

// 导入验证和安全中间件
const SimpleLogger = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');
const { loginLimiter } = require('../middleware/security');

// 用户注册
router.post('/register',
  loginLimiter, // 应用登录速率限制防止恶意注册
  (req, res, next) => {
    const { getSettings } = require('../utils/settings');
    if (!getSettings().validation.registrationEnabled) {
      return fail(res, '注册功能已关闭', 403);
    }
    next();
  },
  (req, res, next) => {
    // 使用动态 validation 规则
    const { register } = require('../utils/validation').userValidation();
    const { validateBody } = require('../utils/validation');
    return validateBody(register)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { username, password, email, is_active, roles } = req.body;

    try {
      const result = await registerUser(username, password, email, is_active, roles);

      // 记录注册日志
      await SimpleLogger.logLogin(username, req.ip, true, 'User registered', req.get('User-Agent'));

      success(res, result, '注册成功', 200);
    } catch (error) {
      // 记录注册失败日志
      await SimpleLogger.logLogin(username, req.ip, false, error.message, req.get('User-Agent'));
      throw error;
    }
  })
);

// 用户登录
router.post('/login',
  loginLimiter, // 应用登录速率限制
  (req, res, next) => {
    const { login } = require('../utils/validation').userValidation();
    const { validateBody } = require('../utils/validation');
    return validateBody(login)(req, res, next);
  },
  catchAsync(async (req, res) => {
    const { username, password } = req.body;

    try {
      const result = await loginUser(username, password);

      // 记录成功登录
      await SimpleLogger.logLogin(username, req.ip, true, '', req.get('User-Agent'));

      success(res, result, '登录成功');
    } catch (error) {
      // 记录失败登录
      await SimpleLogger.logLogin(username, req.ip, false, error.message, req.get('User-Agent'));
      // 根据错误类型返回不同的状态码和消息
      if (error.message === '用户名或密码错误') {
        return fail(res, '用户名或密码错误', 400);
      }
      if (error.message === '用户账户已被禁用') {
        return fail(res, '用户账户已被禁用', 400);
      }

      // 重新抛出错误让catchAsync处理
      throw error;
    }
  })
);

// 用户登出
router.post('/logout', async (req, res) => {
  // 记录登出日志
  if (req.user) {
    await SimpleLogger.logLogout(req.user.username, req.ip, req.get('User-Agent'));
  }

  // JWT是无状态的，服务端无法直接使token失效
  // 实际的登出逻辑应该在客户端清除token
  // 这里只是返回成功响应，实际的token失效由客户端处理
  success(res, null, '用户已登出');
});

module.exports = router;