// utils/logger.js - 简化的操作日志系统
const { UserLog } = require('../models/admin');

// 简化的日志记录器
class SimpleLogger {
  // 记录用户登录
  static async logLogin(username, ip, success = true, reason = '', userAgent = '') {
    try {
      await UserLog.create({
        username,
        action: 'login',
        module: 'auth',
        ip_address: ip,
        user_agent: userAgent,
        status: success ? 'success' : 'failed',
        details: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('记录登录日志失败:', error);
    }
  }

  // 记录用户登出
  static async logLogout(username, ip, userAgent = '') {
    try {
      await UserLog.create({
        username,
        action: 'logout',
        module: 'auth',
        ip_address: ip,
        user_agent: userAgent,
        status: 'success'
      });
    } catch (error) {
      console.error('记录登出日志失败:', error);
    }
  }

  // 记录模块操作（增删改查）
  static async logOperation(userId, username, action, module, targetId = null, targetName = '', ip, userAgent = '', details = {}) {
    try {
      await UserLog.create({
        user_id: userId,
        username,
        action, // create, update, delete, view
        module, // user, blog, comment, tag, role, menu, daySentence
        target_id: targetId,
        target_name: targetName,
        ip_address: ip,
        user_agent: userAgent,
        status: 'success',
        details: JSON.stringify(details)
      });
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }
}

module.exports = SimpleLogger;


