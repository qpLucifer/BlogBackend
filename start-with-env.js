#!/usr/bin/env node

// 检查必需的环境变量
const requiredEnvVars = [
  'NODE_ENV',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'PORT',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars);
  process.exit(1);
}

console.log('🚀 使用环境变量启动应用...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('PORT:', process.env.PORT);

// 启动应用
require('./bin/www');
