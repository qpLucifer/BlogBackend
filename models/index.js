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

  // 优化连接池配置
  pool: {
    max: 3,          // 减少最大连接数
    min: 0,          // 最小连接数
    acquire: 60000,  // 获取连接的最大时间(ms)
    idle: 30000,     // 连接空闲时间(ms)
    evict: 1000,     // 检查空闲连接的间隔时间(ms)
    handleDisconnects: true
  },

  // 数据库连接选项
  dialectOptions: {
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    // 减少连接选项，避免超过64个键的限制
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 移除可能导致键过多的选项
    supportBigNumbers: true,
    bigNumberStrings: true
  },

  // 查询选项
  query: {
    raw: false,
    nest: false
  },

  // 其他优化选项
  retry: {
    max: 3
  },

  // 事务选项
  transactionType: 'IMMEDIATE',
  isolationLevel: 'READ_COMMITTED'
});



// 在开发环境下输出连接信息
if (process.env.NODE_ENV === 'development') {
  console.log('📊 数据库配置信息:');
  console.log(`   - 数据库: ${database}`);
  console.log(`   - 主机: ${host}:${port}`);
  console.log(`   - 用户: ${username}`);
  console.log(`   - 方言: ${dialect}`);
}

// 连接事件监听
sequelize.addHook('beforeConnect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 正在建立数据库连接...');
  }
});

sequelize.addHook('afterConnect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ 数据库连接已建立');
  }
});

sequelize.addHook('beforeDisconnect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 正在断开数据库连接...');
  }
});

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('🛑 收到 SIGINT 信号，正在关闭数据库连接...');
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭数据库连接...');
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error);
    process.exit(1);
  }
});

module.exports = {
  sequelize
};