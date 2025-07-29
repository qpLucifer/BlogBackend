// routes/logs.js - 日志管理路由
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { success, fail } = require('../utils/response');
const { catchAsync } = require('../middleware/errorHandler');
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { Op } = require('sequelize');

// 需要认证
router.use(authenticate);

// 获取日志文件列表
router.get('/files', 
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const logsDir = path.join(__dirname, '../logs');
    
    try {
      const files = await fs.readdir(logsDir);
      const logFiles = [];
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          logFiles.push({
            name: file,
            size: stats.size,
            modified: stats.mtime,
            type: file.includes('error') ? 'error' : 
                  file.includes('auth') ? 'auth' : 
                  file.includes('business') ? 'business' : 'system'
          });
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
router.get('/content/:filename',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const { filename } = req.params;
    const { page = 1, pageSize = 100, level, search } = req.query;
    
    // 安全检查：只允许读取.log文件
    if (!filename.endsWith('.log')) {
      return fail(res, '无效的文件类型', 400);
    }
    
    const filePath = path.join(__dirname, '../logs', filename);
    
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
router.get('/download/:filename',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const { filename } = req.params;
    
    // 安全检查
    if (!filename.endsWith('.log')) {
      return fail(res, '无效的文件类型', 400);
    }
    
    const filePath = path.join(__dirname, '../logs', filename);
    
    try {
      await fs.access(filePath);
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
    const logsDir = path.join(__dirname, '../logs');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    try {
      const files = await fs.readdir(logsDir);
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }
      
      success(res, { deletedCount }, `清理了 ${deletedCount} 个过期日志文件`);
    } catch (error) {
      throw error;
    }
  })
);

// 获取日志统计信息
router.get('/stats',
  checkMenuPermission('日志管理', 'can_read'),
  catchAsync(async (req, res) => {
    const logsDir = path.join(__dirname, '../logs');
    
    try {
      const files = await fs.readdir(logsDir);
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {
          error: 0,
          auth: 0,
          business: 0,
          system: 0
        },
        recentLogs: []
      };
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const fileStats = await fs.stat(filePath);
          
          stats.totalFiles++;
          stats.totalSize += fileStats.size;
          
          // 分类统计
          if (file.includes('error')) stats.fileTypes.error++;
          else if (file.includes('auth')) stats.fileTypes.auth++;
          else if (file.includes('business')) stats.fileTypes.business++;
          else stats.fileTypes.system++;
          
          // 最近的日志文件
          stats.recentLogs.push({
            name: file,
            size: fileStats.size,
            modified: fileStats.mtime
          });
        }
      }
      
      // 按修改时间排序，取最近5个
      stats.recentLogs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      stats.recentLogs = stats.recentLogs.slice(0, 5);
      
      success(res, stats, '获取日志统计信息成功');
    } catch (error) {
      if (error.code === 'ENOENT') {
        success(res, {
          totalFiles: 0,
          totalSize: 0,
          fileTypes: { error: 0, auth: 0, business: 0, system: 0 },
          recentLogs: []
        }, '日志目录不存在');
      } else {
        throw error;
      }
    }
  })
);

module.exports = router;
