// models/blogSentence.js - 每日一句模型
const { DataTypes } = require('sequelize');

// 创建每日一句模型的工厂函数，避免循环依赖
const createBlogSentenceModel = (sequelize) => {
  const BlogSentence = sequelize.define('blogSentence', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    auth: { type: DataTypes.STRING(255), allowNull: false },
    day_sentence: { type: DataTypes.STRING(255), allowNull: false },
  }, {
    tableName: 'blog_sentence',
    timestamps: false,
    underscored: true
  });
  
  return { BlogSentence };
};

module.exports = { createBlogSentenceModel };