const { sequelize } = require("./index");
// models/index.js - 数据库模型
const { DataTypes } = require("sequelize");

// 定义用户模型 - 优化索引配置
const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false },
    password_hash: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    mood: { type: DataTypes.STRING(255), allowNull: true },
    signature: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "blog_users",
    timestamps: true,
    underscored: true,
    // 手动控制索引，只创建必要的索引
    indexes: [
      {
        unique: true,
        fields: ['username'], // 用户名唯一索引
        name: 'user_username_unique'
      },
      {
        unique: true,
        fields: ['email'], // 邮箱唯一索引
        name: 'user_email_unique'
      },
      {
        fields: ['is_active'], // 状态索引（用于查询活跃用户）
        name: 'user_active_idx'
      },
      {
        fields: ['created_at'], // 创建时间索引（用于排序）
        name: 'user_created_idx'
      }
    ]
  }
);

// 定义角色模型
const Role = sequelize.define(
  "Role",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    description: DataTypes.STRING(255),
  },
  {
    tableName: "blog_roles",
    timestamps: false,
    underscored: true,
  }
);

// 定义关联关系 - 优化索引配置
const UserRole = sequelize.define(
  "UserRole",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_users',
        key: 'id'
      }
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_roles',
        key: 'id'
      }
    },
  },
  {
    tableName: "blog_user_roles",
    timestamps: false,
    // 手动控制索引，避免自动创建过多索引
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id'], // 复合唯一索引
        name: 'user_role_unique'
      },
      {
        fields: ['user_id'], // 用户ID索引（用于查询用户的角色）
        name: 'user_role_user_idx'
      },
      {
        fields: ['role_id'], // 角色ID索引（用于查询角色的用户）
        name: 'user_role_role_idx'
      }
    ]
  }
);

// 设置关联 - 禁用自动索引创建
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "user_id",
  otherKey: "role_id",
  as: "roles",
  // 禁用自动创建约束和索引
  constraints: false,
  // 不创建额外的索引
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "role_id",
  otherKey: "user_id",
  as: "users",
  constraints: false,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 定义菜单模型 - 优化索引配置
const Menu = sequelize.define(
  "Menu",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    path: { type: DataTypes.STRING(255), allowNull: false },
    icon: { type: DataTypes.STRING(100) },
    parent_id: { type: DataTypes.INTEGER, allowNull: true }, // 父菜单ID
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "blog_menus",
    timestamps: false,
    underscored: true,
    // 手动控制索引
    indexes: [
      {
        unique: true,
        fields: ['path'], // 路径唯一索引
        name: 'menu_path_unique'
      },
      {
        fields: ['parent_id'], // 父菜单索引（用于查询子菜单）
        name: 'menu_parent_idx'
      },
      {
        fields: ['parent_id', 'order'], // 复合索引（用于排序子菜单）
        name: 'menu_parent_order_idx'
      },
      {
        fields: ['hidden'], // 隐藏状态索引
        name: 'menu_hidden_idx'
      }
    ]
  }
);

// 菜单与角色多对多关系 - 优化索引配置
const RoleMenu = sequelize.define(
  "RoleMenu",
  {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_roles',
        key: 'id'
      }
    },
    menu_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_menus',
        key: 'id'
      }
    },
    can_create: { type: DataTypes.BOOLEAN, defaultValue: false },
    can_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    can_update: { type: DataTypes.BOOLEAN, defaultValue: false },
    can_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "blog_role_menus",
    timestamps: false,
    // 手动控制索引
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'menu_id'], // 复合唯一索引
        name: 'role_menu_unique'
      },
      {
        fields: ['role_id'], // 角色ID索引（用于查询角色的菜单）
        name: 'role_menu_role_idx'
      },
      {
        fields: ['menu_id'], // 菜单ID索引（用于查询菜单的角色）
        name: 'role_menu_menu_idx'
      },
      {
        // 权限查询优化索引
        fields: ['role_id', 'can_read'],
        name: 'role_menu_read_idx'
      }
    ]
  }
);

// 设置关联 - 禁用自动索引创建
Role.belongsToMany(Menu, {
  through: RoleMenu,
  foreignKey: "role_id",
  otherKey: "menu_id",
  as: "menus",
  constraints: false,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Menu.belongsToMany(Role, {
  through: RoleMenu,
  foreignKey: "menu_id",
  otherKey: "role_id",
  as: "roles",
  constraints: false,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

module.exports = { User, Role, UserRole, Menu, RoleMenu };
