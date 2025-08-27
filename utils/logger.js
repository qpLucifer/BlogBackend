// utils/logger.js - 简化的操作日志系统
const logger = require('../config/winston'); // Import Winston logger
// 动态导入模型以避免循环依赖
const wsManager = require('./websocket');

// 简化的日志记录器
class SimpleLogger {
  // 记录用户登录
  static async logLogin(username, ip, success = true, reason = '', userAgent = '') {
    try {
      const { UserLog } = require('../models');
      await UserLog.create({
        username,
        action: 'login',
        module: 'auth',
        log_type: success ? 'operation' : 'security',
        ip_address: ip,
        user_agent: userAgent,
        status: success ? 'success' : 'failed',
        details: JSON.stringify({ reason })
      });
    } catch (error) {
      logger.error('记录登录日志失败:', error);
    }
  }

  // 记录用户登出
  static async logLogout(username, ip, userAgent = '') {
    try {
      const { UserLog } = require('../models');
      await UserLog.create({
        username,
        action: 'logout',
        module: 'auth',
        log_type: 'operation',
        ip_address: ip,
        user_agent: userAgent,
        status: 'success'
      });
    } catch (error) {
      logger.error('记录登出日志失败:', error);
    }
  }

  // 记录模块操作（增删改查）
  static async logOperation(userId, username, action, module, targetId = null, targetName = '', ip, userAgent = '', details = {}, logType = 'operation', status = 'success') {
    try {
      const { UserLog } = require('../models');
      const logEntry = await UserLog.create({
        user_id: userId,
        username,
        action, // create, update, delete, view
        module, // user, blog, comment, tag, role, menu, daySentence
        log_type: logType, // operation, security, system, error
        target_id: targetId,
        target_name: targetName,
        ip_address: ip,
        user_agent: userAgent,
        status: status,
        details: JSON.stringify(details)
      });

      // 如果是错误日志，通过WebSocket推送
      if (status === 'error' || logType === 'error') {
        const errorLogDataNum = await UserLog.count({
          where: {
            status: 'failed',
            hasRead: false
          }
        });
        wsManager.pushErrorLog(errorLogDataNum);
      }
    } catch (error) {
      logger.error('记录操作日志失败:', error);
    }
  }

  // 记录错误日志（便捷方法）
  static async logError(userId, username, module, errorMessage, req, errorDetails = {}, logType = 'error') {
    try {
      const { UserLog } = require('../models');
      await UserLog.create({
        user_id: userId,
        username,
        action: 'error',
        module,
        log_type: logType,
        target_id: null,
        target_name: `${req.method} ${req.originalUrl}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || '',
        status: 'failed',
        details: JSON.stringify({
          error_message: errorMessage,
          request_body: req.body,
          request_params: req.params,
          request_query: req.query,
          ...errorDetails
        })
      });
    } catch (error) {
      logger.error('记录错误日志失败:', error);
    }
  }
}

module.exports = SimpleLogger;


