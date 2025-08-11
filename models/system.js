const { sequelize } = require('./index');
const { DataTypes } = require('sequelize');

module.exports = (sequelizeInstance = sequelize) => {
  // 简单持久化系统设置，单行表
  const SystemSetting = sequelizeInstance.define('SystemSetting', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false, defaultValue: 1 },
    settings: { type: DataTypes.TEXT('long'), allowNull: false },
  }, {
    tableName: 'blog_system_settings',
    timestamps: true,
    underscored: true,
  });
  return SystemSetting;
};

