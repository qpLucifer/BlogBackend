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
  console.error('请确保环境变量已正确设置');
  process.exit(1);
}

console.log('🚀 使用环境变量启动应用...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

// 启动应用
require('./bin/www');
