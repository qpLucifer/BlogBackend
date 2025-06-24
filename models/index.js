// models/index.js - 数据库模型
const { Sequelize } = require('sequelize');

// 明确指定方言（修复 Sequelize v4+ 问题）
const dialect = process.env.DB_DIALECT || 'mysql';
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
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