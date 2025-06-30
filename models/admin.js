const { sequelize } = require('./index');
// models/index.js - 数据库模型
const { DataTypes } = require('sequelize');

// 定义用户模型
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'blog_users',
  timestamps: true,
  underscored: true
});

// 定义角色模型
const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  description: DataTypes.STRING(255)
}, {
  tableName: 'blog_roles',
  timestamps: false,
  underscored: true
});

// 定义权限模型
const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  description: DataTypes.STRING(255)
}, {
  tableName: 'blog_permissions',
  timestamps: false,
  underscored: true
});

// 定义关联关系
const UserRole = sequelize.define('UserRole', {
    user_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER
  }, {
    tableName: 'blog_user_roles',
    timestamps: false
  });
  
  const RolePermission = sequelize.define('RolePermission', {
    role_id: DataTypes.INTEGER,
    permission_id: DataTypes.INTEGER
  }, {
    tableName: 'blog_role_permissions',
    timestamps: false
  });

// 设置关联
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

// 定义菜单模型
const Menu = sequelize.define('Menu', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  path: { type: DataTypes.STRING(255), allowNull: false },
  icon: { type: DataTypes.STRING(100) },
  parent_id: { type: DataTypes.INTEGER, allowNull: true }, // 父菜单ID
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  hidden: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'blog_menus',
  timestamps: false,
  underscored: true
});

// 菜单与角色多对多关系
const RoleMenu = sequelize.define('RoleMenu', {
  role_id: DataTypes.INTEGER,
  menu_id: DataTypes.INTEGER
}, {
  tableName: 'blog_role_menus',
  timestamps: false
});

// 设置关联
Role.belongsToMany(Menu, { through: RoleMenu, foreignKey: 'role_id' });
Menu.belongsToMany(Role, { through: RoleMenu, foreignKey: 'menu_id' });

module.exports = { User, Role, Permission, UserRole, RolePermission, Menu, RoleMenu };