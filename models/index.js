// models/index.js - 数据库模型
const { Sequelize } = require('sequelize');

// 明确指定方言（修复 Sequelize v4+ 问题）
const dialect = process.env.DB_DIALECT || 'mysql';
const sequelize = new Sequelize('blogDb', 'blog_user', '7jWW2waA74yZpGEx', {
  host: '39.104.13.43',
  port: '3306',
  dialect: dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };