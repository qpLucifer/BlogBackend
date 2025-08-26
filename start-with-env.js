#!/usr/bin/env node

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.DB_DIALECT = 'mysql';
process.env.DB_HOST = '39.104.13.43';
process.env.DB_PORT = 3306;
process.env.DB_NAME = 'blogDb';
process.env.DB_USER = 'blog_user';
process.env.DB_PASSWORD = '7jWW2waA74yZpGEx';
process.env.PORT = 3000;
process.env.JWT_SECRET = 'money_roc_secret_key';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CORS_ORIGIN = 'https://www.jiayizhou.top:3001';

console.log('🚀 使用环境变量启动应用...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('PORT:', process.env.PORT);

// 启动应用
require('./bin/www');
