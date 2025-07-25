// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../utils/auth');
const jwt = require('jsonwebtoken');
const { success, fail } = require('../utils/response');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, is_active, roles } = req.body;
    const result = await registerUser(username, password, email, is_active, roles);
    success(res, result, '注册成功', 200);
  } catch (error) {
    fail(res, error.message || '注册失败', 400);
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    success(res, result, '登录成功');
  } catch (error) {
    fail(res, error.message || '登录失败', 401);
  }
});

// 用户登出
router.post('/logout', (req, res) => {
  // 设置jwt过期
  jwt.sign({}, process.env.JWT_SECRET, {
    expiresIn: 1, // 1秒后过期
  },(err,token)=>{
    if(err){
      console.error('JWT签名失败:', err);
    }
  });
  success(res, null, '用户已登出');
});

module.exports = router;