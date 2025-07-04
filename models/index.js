// models/index.js - 数据库模型
const { Sequelize } = require('sequelize');

// 从环境变量获取数据库配置
const dialect = process.env.DB_DIALECT || 'mysql';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '3306';
const database = process.env.DB_NAME || 'blogDb';
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const sequelize = new Sequelize(database, username, password, {
  host: host,
  port: port,
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