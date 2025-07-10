const { sequelize } = require("./index");
const { DataTypes } = require("sequelize");

// 博客模型
const Blog = sequelize.define(
  "Blog",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    cover_image: { type: DataTypes.STRING(255) },
    content: { type: DataTypes.TEXT, allowNull: false },
    summary: { type: DataTypes.STRING(500) },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },
    likes: { type: DataTypes.INTEGER, defaultValue: 0 },
    comments_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "blog_articles",
    timestamps: true,
    underscored: true,
  }
);

// 标签模型
const Tag = sequelize.define(
  "Tag",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  },
  {
    tableName: "blog_tags",
    timestamps: true,
    underscored: true,
  }
);

// 博客-标签多对多关系
const BlogTag = sequelize.define(
  "BlogTag",
  {
    blog_id: DataTypes.INTEGER,
    tag_id: DataTypes.INTEGER,
  },
  {
    tableName: "blog_article_tags",
    timestamps: false,
  }
);

Blog.belongsToMany(Tag, { through: BlogTag, foreignKey: "blog_id", as: "tags" });
Tag.belongsToMany(Blog, { through: BlogTag, foreignKey: "tag_id" });

// 评论模型
const Comment = sequelize.define(
  "Comment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    blog_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    parent_id: { type: DataTypes.INTEGER, allowNull: true }, // 楼中楼
  },
  {
    tableName: "blog_comments",
    timestamps: true,
    underscored: true,
  }
);

Blog.hasMany(Comment, { foreignKey: "blog_id", as: "comments" });
Comment.belongsTo(Blog, { foreignKey: "blog_id" });

module.exports = { Blog, Tag, BlogTag, Comment }; 