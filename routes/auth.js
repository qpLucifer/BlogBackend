// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../utils/auth');
const jwt = require('jsonwebtoken');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, is_active, roles } = req.body;
    const result = await registerUser(username, password, email, is_active, roles);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
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
  res.json({ message: '用户已登出' });
});

module.exports = router;