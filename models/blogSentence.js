const { sequelize } = require('./index');
// models/index.js - 数据库模型
const { DataTypes } = require('sequelize');
const BlogSentence = sequelize.define('blogSentence', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  auth: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  day_sentence: { type: DataTypes.STRING(255), allowNull: false },
}, {
  tableName: 'blog_sentence',
  timestamps: false,
  underscored: true
});
module.exports = { BlogSentence };