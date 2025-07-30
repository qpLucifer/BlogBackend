# 📝 日志系统使用指南

## 概述

BlogBackend项目采用了基于Winston的多类型日志系统，支持按天分割、自动压缩和分类存储。每种类型的日志都有独立的目录和文件，便于管理和查看。

## 日志类型

### 1. 错误日志 (error)
记录系统错误和异常信息
- 目录: `logs/error/`
- 文件格式: `error-YYYY-MM-DD.log`
- 级别: error

### 2. 认证日志 (auth)
记录用户认证相关操作
- 目录: `logs/auth/`
- 文件格式: `auth-YYYY-MM-DD.log`
- 级别: info, warn
- 内容: 登录、登出、权限验证、密码修改等

### 3. 业务日志 (business)
记录业务操作和流程
- 目录: `logs/business/`
- 文件格式: `business-YYYY-MM-DD.log`
- 级别: info
- 内容: 用户创建、博客发布、角色分配、评论审核等

### 4. 系统日志 (system)
记录系统运行状态和信息
- 目录: `logs/system/`
- 文件格式: `system-YYYY-MM-DD.log`
- 级别: info, warn, error
- 内容: 系统启动、配置变更、性能信息等

### 5. API日志 (api)
记录API请求和响应
- 目录: `logs/api/`
- 文件格式: `api-YYYY-MM-DD.log`
- 级别: http
- 内容: 请求方法、URL、响应状态、耗时等

### 6. 安全日志 (security)
记录安全相关事件
- 目录: `logs/security/`
- 文件格式: `security-YYYY-MM-DD.log`
- 级别: warn, info
- 内容: 文件上传、未授权访问、可疑活动、数据导出等

### 7. 数据库日志 (database)
记录数据库操作和查询
- 目录: `logs/database/`
- 文件格式: `database-YYYY-MM-DD.log`
- 级别: debug, error
- 内容: SQL查询、连接状态、事务操作等

## 使用方法

### 基础日志记录

```javascript
const { logger, error, warn, info, debug } = require('../utils/logger');

// 基础日志方法
error('系统错误', { error: err.message, stack: err.stack });
warn('警告信息', { userId: 123 });
info('信息记录', { action: 'user_login' });
debug('调试信息', { query: 'SELECT * FROM users' });
```

### 认证日志

```javascript
const { auth } = require('../utils/logger');

// 登录成功
auth.login(username, req.ip, true);

// 登录失败
auth.login(username, req.ip, false, '密码错误');

// 登出
auth.logout(username, req.ip);

// 密码修改
auth.passwordChange(username, req.ip, true);

// 账户锁定
auth.accountLocked(username, req.ip, '多次登录失败');
```

### 业务日志

```javascript
const { business } = require('../utils/logger');

// 用户创建
business.userCreated(userId, createdBy, req.ip);

// 博客发布
business.blogPublished(blogId, authorId, title);

// 角色分配
business.roleAssigned(userId, roleId, assignedBy);

// 评论审核
business.commentModerated(commentId, 'approved', moderatorId);

// 配置变更
business.configChanged('max_upload_size', '5MB', '10MB', userId);
```

### 安全日志

```javascript
const { security } = require('../utils/logger');

// 文件上传
security.fileUpload(filename, size, mimetype, req.ip, userId);

// 未授权访问
security.unauthorizedAccess(req.ip, req.originalUrl, userId);

// 可疑活动
security.suspiciousActivity(req.ip, 'Multiple failed login attempts', {
  attempts: 5,
  timeWindow: '5 minutes'
});

// 数据导出
security.dataExport(userId, 'user_list', 150, req.ip);
```

### 数据库日志

```javascript
const { dbLogger } = require('../utils/logger');

// 查询日志
dbLogger.query('SELECT * FROM users WHERE id = ?', [123], 45);

// 错误日志
dbLogger.error(error, 'SELECT * FROM users', []);

// 连接日志
dbLogger.connection('connected', { host: 'localhost', database: 'blogDb' });

// 事务日志
dbLogger.transaction('started', { transactionId: 'tx_123' });
```

## 中间件使用

### Express日志中间件

```javascript
const { expressLogger } = require('../utils/logger');

// 在app.js中使用
app.use(expressLogger);
```

### 安全日志中间件

```javascript
const { 
  logFileUpload, 
  logUnauthorizedAccess, 
  logSuspiciousActivity,
  logDataExport,
  logSensitiveOperation 
} = require('../middleware/securityLogger');

// 文件上传路由
router.post('/upload', logFileUpload, upload.single('file'), handler);

// 数据导出路由
router.get('/export', logDataExport('user_data'), handler);

// 敏感操作路由
router.delete('/user/:id', logSensitiveOperation('delete_user'), handler);
```

## 日志格式

所有日志都采用JSON格式存储，包含以下字段：

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "User login successful",
  "service": "blog-backend",
  "type": "auth",
  "username": "admin",
  "ip": "192.168.1.100",
  "success": true
}
```

## 日志管理

### 自动轮转
- 每天创建新的日志文件
- 文件大小超过20MB时自动轮转
- 自动压缩旧日志文件
- 保留30天的日志文件

### 手动清理

```bash
# 清理30天前的日志
npm run logs:clean

# 运行日志轮转脚本
./logs/rotate-logs.sh
```

### 查看日志

```bash
# 查看当前错误日志
tail -f logs/error/error-current.log

# 查看特定日期的认证日志
cat logs/auth/auth-2024-01-01.log

# 搜索特定用户的操作
grep "username.*admin" logs/auth/*.log

# 查看API访问统计
grep "API Request" logs/api/*.log | wc -l
```

## 性能考虑

1. **异步写入**: 所有日志写入都是异步的，不会阻塞主线程
2. **文件轮转**: 自动轮转避免单个文件过大
3. **压缩存储**: 旧日志文件自动压缩节省空间
4. **分类存储**: 不同类型日志分开存储，提高查询效率

## 监控和告警

### 错误日志监控
```bash
# 监控错误日志
tail -f logs/error/error-current.log | grep -i "error"

# 统计每小时错误数量
grep "$(date '+%Y-%m-%d %H')" logs/error/error-current.log | wc -l
```

### 安全事件监控
```bash
# 监控可疑活动
tail -f logs/security/security-current.log | grep "Suspicious"

# 统计未授权访问
grep "Unauthorized access" logs/security/*.log | wc -l
```

## 最佳实践

1. **合理使用日志级别**: 
   - error: 系统错误
   - warn: 警告信息
   - info: 重要信息
   - debug: 调试信息

2. **包含上下文信息**: 记录用户ID、IP地址、操作时间等

3. **避免敏感信息**: 不要记录密码、令牌等敏感数据

4. **定期清理**: 定期清理旧日志文件，避免磁盘空间不足

5. **监控日志大小**: 监控日志文件大小和磁盘使用情况

## 故障排查

### 常见问题

1. **日志文件过大**: 检查轮转配置，手动清理旧文件
2. **磁盘空间不足**: 清理旧日志文件，调整保留策略
3. **权限问题**: 确保应用有写入日志目录的权限
4. **性能影响**: 调整日志级别，减少不必要的日志输出

### 调试命令

```bash
# 检查日志目录权限
ls -la logs/

# 查看磁盘使用情况
du -sh logs/

# 检查日志文件数量
find logs/ -name "*.log" | wc -l

# 查看最新的错误
tail -20 logs/error/error-current.log
```
