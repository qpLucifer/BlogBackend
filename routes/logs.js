// routes/logs.js - 日志管理路由
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { success, fail } = require('../utils/response');
const { catchAsync } = require('../middleware/errorHandler');
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { logCleanup, security } = require('../utils/logger');

// 需要认证
router.use(authenticate);

// 获取日志文件列表
router.get('/files',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const logsDir = path.join(__dirname, '../logs');
    const logTypes = ['error', 'auth', 'business', 'system', 'api', 'security', 'database'];

    try {
      const logFiles = [];

      // 遍历每个日志类型目录
      for (const type of logTypes) {
        const typeDir = path.join(logsDir, type);

        try {
          const files = await fs.readdir(typeDir);

          for (const file of files) {
            if (file.endsWith('.log')) {
              const filePath = path.join(typeDir, file);
              const stats = await fs.stat(filePath);

              logFiles.push({
                name: file,
                size: stats.size,
                modified: stats.mtime,
                type: type,
                path: `${type}/${file}`
              });
            }
          }
        } catch (error) {
          // 如果某个类型目录不存在，跳过
          if (error.code !== 'ENOENT') {
            console.error(`Error reading ${type} logs:`, error);
          }
        }
      }

      // 按修改时间排序
      logFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      success(res, logFiles, '获取日志文件列表成功');
    } catch (error) {
      if (error.code === 'ENOENT') {
        success(res, [], '日志目录不存在');
      } else {
        throw error;
      }
    }
  })
);

// 读取日志文件内容
router.get('/content/:type/:filename',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const { type, filename } = req.params;
    const { page = 1, pageSize = 100, level, search } = req.query;

    // 安全检查：只允许读取.log文件和有效的类型
    if (!filename.endsWith('.log')) {
      return fail(res, '无效的文件类型', 400);
    }

    const validTypes = ['error', 'auth', 'business', 'system', 'api', 'security', 'database'];
    if (!validTypes.includes(type)) {
      return fail(res, '无效的日志类型', 400);
    }

    const filePath = path.join(__dirname, '../logs', type, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // 解析日志行
      let logs = lines.map((line, index) => {
        try {
          // 尝试解析JSON格式的日志
          const logData = JSON.parse(line);
          return {
            id: index + 1,
            timestamp: logData.timestamp,
            level: logData.level,
            message: logData.message,
            meta: logData.meta || {},
            raw: line
          };
        } catch {
          // 如果不是JSON格式，按普通文本处理
          const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(\w+):\s+(.+)$/);
          if (match) {
            return {
              id: index + 1,
              timestamp: match[1],
              level: match[2],
              message: match[3],
              meta: {},
              raw: line
            };
          }
          return {
            id: index + 1,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            meta: {},
            raw: line
          };
        }
      });
      
      // 过滤
      if (level) {
        logs = logs.filter(log => log.level === level);
      }
      
      if (search) {
        logs = logs.filter(log => 
          log.message.toLowerCase().includes(search.toLowerCase()) ||
          log.raw.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // 分页
      const total = logs.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + parseInt(pageSize);
      const paginatedLogs = logs.slice(startIndex, endIndex);
      
      success(res, {
        list: paginatedLogs,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        filename
      }, '读取日志内容成功');
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return fail(res, '日志文件不存在', 404);
      }
      throw error;
    }
  })
);

// 下载日志文件
router.get('/download/:type/:filename',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const { type, filename } = req.params;

    // 安全检查
    if (!filename.endsWith('.log')) {
      return fail(res, '无效的文件类型', 400);
    }

    const validTypes = ['error', 'auth', 'business', 'system', 'api', 'security', 'database'];
    if (!validTypes.includes(type)) {
      return fail(res, '无效的日志类型', 400);
    }

    const filePath = path.join(__dirname, '../logs', type, filename);

    try {
      await fs.access(filePath);

      // 记录下载日志
      if (security) {
        security.dataExport(req.user.id, 'log_file', 1, req.ip);
      }

      res.download(filePath, filename);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return fail(res, '文件不存在', 404);
      }
      throw error;
    }
  })
);

// 清理日志文件
router.delete('/clean',
  checkMenuPermission('日志管理', 'can_delete'),
  catchAsync(async (req, res) => {
    const { days = 7 } = req.body;

    try {
      // 使用新的日志清理工具
      const result = await logCleanup.cleanOldLogs(parseInt(days));

      // 记录清理操作
      if (security) {
        security.dataExport(req.user.id, 'log_cleanup', result.deletedCount, req.ip);
      }

      success(res, result, `清理了 ${result.deletedCount} 个过期日志文件`);
    } catch (error) {
      throw error;
    }
  })
);

// 获取日志统计信息
router.get('/stats',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    try {
      // 使用新的日志统计工具
      const stats = await logCleanup.getLogStats();

      success(res, stats, '获取日志统计信息成功');
    } catch (error) {
      // 如果出错，返回默认统计信息
      success(res, {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {
          error: 0,
          auth: 0,
          business: 0,
          system: 0,
          api: 0,
          security: 0,
          database: 0
        },
        recentLogs: []
      }, '获取日志统计信息失败，返回默认值');
    }
  })
);

module.exports = router;
