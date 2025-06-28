#!/usr/bin/env node

// 环境变量检查脚本
require('dotenv').config();

console.log('=== 环境变量检查 ===');
console.log('当前工作目录:', process.cwd());
console.log('');

// 检查.env文件
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

console.log('Env文件路径:', envPath);
console.log('Env文件是否存在:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('Env文件大小:', fs.statSync(envPath).size, 'bytes');
  console.log('Env文件权限:', fs.statSync(envPath).mode.toString(8));
  console.log('');
  console.log('Env文件内容:');
  console.log('---');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('---');
}

console.log('');
console.log('=== 环境变量值 ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('PORT:', process.env.PORT);

console.log('');
console.log('=== 数据库连接测试 ===');
try {
  const { sequelize } = require('./models');
  console.log('数据库配置:');
  console.log('- Host:', sequelize.config.host);
  console.log('- Port:', sequelize.config.port);
  console.log('- Database:', sequelize.config.database);
  console.log('- Username:', sequelize.config.username);
  console.log('- Password:', sequelize.config.password ? '已设置' : '未设置');
} catch (error) {
  console.log('数据库配置错误:', error.message);
}

console.log('');
console.log('=== 检查完成 ==='); 