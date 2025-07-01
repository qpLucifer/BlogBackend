// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../utils/auth');

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

module.exports = router;