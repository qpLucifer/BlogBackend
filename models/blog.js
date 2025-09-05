const { DataTypes } = require("sequelize");

// models/blog.js - 博客相关模型
const createBlogModels = (sequelize) => {
  // 博客模型 - 优化索引配置
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
      is_choice: { type: DataTypes.BOOLEAN, defaultValue: false },
      need_time: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: "blog_articles",
      timestamps: true,
      underscored: true,
      // 手动控制索引
      indexes: [
        {
          fields: ['author_id'], // 作者索引（用于查询作者的博客）
          name: 'blog_author_idx'
        },
        {
          fields: ['is_published'], // 发布状态索引
          name: 'blog_published_idx'
        },
        {
          fields: ['is_published', 'created_at'], // 复合索引（用于查询已发布博客并排序）
          name: 'blog_published_created_idx'
        },
        {
          fields: ['is_choice'], // 精选状态索引
          name: 'blog_choice_idx'
        },
        {
          fields: ['views'], // 浏览量索引（用于热门排序）
          name: 'blog_views_idx'
        },
        {
          fields: ['likes'], // 点赞数索引
          name: 'blog_likes_idx'
        },
        {
          fields: ['created_at'], // 创建时间索引（用于时间排序）
          name: 'blog_created_idx'
        }
      ]
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

  // 博客-标签多对多关系 - 优化索引配置
  const BlogTag = sequelize.define(
    "BlogTag",
    {
      blog_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'blog_articles',
          key: 'id'
        }
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'blog_tags',
          key: 'id'
        }
      },
    },
    {
      tableName: "blog_article_tags",
      timestamps: false,
      // 手动控制索引
      indexes: [
        {
          unique: true,
          fields: ['blog_id', 'tag_id'], // 复合唯一索引
          name: 'blog_tag_unique'
        },
        {
          fields: ['blog_id'], // 博客ID索引（用于查询博客的标签）
          name: 'blog_tag_blog_idx'
        },
        {
          fields: ['tag_id'], // 标签ID索引（用于查询标签的博客）
          name: 'blog_tag_tag_idx'
        }
      ]
    }
  );

  // 设置关联 - 禁用自动索引创建
  Blog.belongsToMany(Tag, {
    through: BlogTag,
    foreignKey: "blog_id",
    otherKey: "tag_id",
    as: "tags",
    constraints: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  Tag.belongsToMany(Blog, {
    through: BlogTag,
    foreignKey: "tag_id",
    otherKey: "blog_id",
    as: "blogs",
    constraints: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // 评论模型 - 优化索引配置
  const Comment = sequelize.define(
    "Comment",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      blog_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      parent_id: { type: DataTypes.INTEGER, allowNull: true }, // 楼中楼
      is_replied: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // 是否已回复
    },
    {
      tableName: "blog_comments",
      timestamps: true,
      underscored: true,
      // 手动控制索引
      indexes: [
        {
          fields: ['blog_id'], // 博客ID索引（用于查询博客的评论）
          name: 'comment_blog_idx'
        },
        {
          fields: ['user_id'], // 用户ID索引（用于查询用户的评论）
          name: 'comment_user_idx'
        },
        {
          fields: ['parent_id'], // 父评论索引（用于查询回复）
          name: 'comment_parent_idx'
        },
        {
          fields: ['blog_id', 'parent_id'], // 复合索引（用于查询博客的主评论）
          name: 'comment_blog_parent_idx'
        },
        {
          fields: ['blog_id', 'created_at'], // 复合索引（用于按时间排序博客评论）
          name: 'comment_blog_created_idx'
        },
        {
          fields: ['created_at'], // 创建时间索引
          name: 'comment_created_idx'
        },
        {
          fields: ['is_replied'], // 回复状态索引
          name: 'comment_replied_idx'
        }
      ]
    }
  );

  // 设置关联 - 不创建额外索引
  Blog.hasMany(Comment, {
    foreignKey: "blog_id",
    as: "comments",
    constraints: false
  });
  Comment.belongsTo(Blog, {
    foreignKey: "blog_id",
    constraints: false
  });

  return { Blog, Tag, BlogTag, Comment };
};

module.exports = { createBlogModels }; 