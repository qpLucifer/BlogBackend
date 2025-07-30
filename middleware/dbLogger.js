// middleware/dbLogger.js - 数据库日志中间件
const { dbLogger } = require('../utils/logger');

// Sequelize 查询日志中间件
const setupDatabaseLogging = (sequelize) => {
  try {
    // 使用logging选项而不是hooks
    if (sequelize && sequelize.options) {
      sequelize.options.logging = (sql, timing) => {
        try {
          const duration = timing || 0;
          dbLogger.query(sql, [], duration);

          // 记录慢查询
          if (duration > 1000) {
            dbLogger.query(`[SLOW QUERY] ${sql}`, [], duration);
          }
        } catch (error) {
          console.error('Database logging error:', error);
        }
      };
    }

    console.log('✅ Database logging setup completed');
  } catch (error) {
    console.error('❌ Database logging setup failed:', error.message);
  }
};

module.exports = {
  setupDatabaseLogging
};
