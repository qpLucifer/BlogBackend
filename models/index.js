// models/index.js - 数据库模型
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();


// 明确指定方言（修复 Sequelize v4+ 问题）
const dialect = process.env.DB_DIALECT || 'mysql';
console.log(`当前环境: ${process.env.DB_DIALECT}`);
console.log(`使用的数据库方言: ${dialect}`,process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_HOST, process.env.DB_PORT);
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

// 测试数据库连接
sequelize.authenticate()
  .then(() => console.log('数据库连接成功'))
  .catch(err => console.error('数据库连接失败:', err));

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

// 定义关联关系
User.belongsToMany(Role, { through: 'UserRoles' });
Role.belongsToMany(User, { through: 'UserRoles' });
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });

module.exports = { sequelize, User, Role, Permission, UserRole, RolePermission };