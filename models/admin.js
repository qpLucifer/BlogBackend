const { sequelize } = require('./index');
// models/index.js - 数据库模型
const { DataTypes } = require('sequelize');

// 定义用户模型
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(100), allowNull: false },
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

module.exports = { User, Role, Permission, UserRole, RolePermission };