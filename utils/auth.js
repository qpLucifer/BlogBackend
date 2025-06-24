// utils/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// 密码加密
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// 密码验证
const validatePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1h' } // 默认过期时间为1小时
  );
};

// 用户注册
const registerUser = async (username, password) => {
  const hashedPassword = await hashPassword(password);
  return User.create({ username, password_hash: hashedPassword });
};

// 用户登录
const loginUser = async (username, password) => {
  const user = await User.findOne({ where: { username } });
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const isValid = await validatePassword(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('密码错误');
  }
  
  return {
    token: generateToken(user),
    user: {
      id: user.id,
      username: user.username,
    }
  };
};

module.exports = {
  hashPassword,
  validatePassword,
  generateToken,
  registerUser,
  loginUser
};