// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../utils/auth');
const { success } = require('../utils/response');

// 导入验证和安全中间件
const { userValidation } = require('../utils/validation');
const { auth, business, security } = require('../utils/logger');
const { catchAsync } = require('../middleware/errorHandler');

// 用户注册
router.post('/register',
  catchAsync(async (req, res) => {
    const { username, password, email, is_active, roles } = req.body;

    try {
      const result = await registerUser(username, password, email, is_active, roles);

      // 记录注册日志
      auth.login(username, req.ip, true, 'User registered');
      business.userCreated(result.user.id, 'system', req.ip);

      success(res, result, '注册成功', 200);
    } catch (error) {
      // 记录注册失败日志
      auth.login(username, req.ip, false, error.message);
      throw error;
    }
  })
);

// 用户登录
router.post('/login',
  catchAsync(async (req, res) => {
    const { username, password } = req.body;

    try {
      const result = await loginUser(username, password);

      // 记录成功登录
      auth.login(username, req.ip, true);

      success(res, result, '登录成功');
    } catch (error) {
      // 记录失败登录
      auth.login(username, req.ip, false, error.message);

      // 重新抛出错误让catchAsync处理
      throw error;
    }
  })
);

// 用户登出
router.post('/logout', (req, res) => {
  // 记录登出日志
  if (req.user) {
    auth.logout(req.user.username, req.ip);
  }

  // JWT是无状态的，服务端无法直接使token失效
  // 实际的登出逻辑应该在客户端清除token
  // 这里只是返回成功响应，实际的token失效由客户端处理
  success(res, null, '用户已登出');
});

module.exports = router;