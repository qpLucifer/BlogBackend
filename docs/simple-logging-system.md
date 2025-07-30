# 📝 简化的操作日志系统

## 概述

BlogBackend项目现在使用了一个简化的操作日志系统，专注于记录用户的关键操作，包括：
- 用户登录/登出信息
- 用户IP地址记录
- 模块的增删改查操作

## 数据库表结构

### user_logs 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID（可为空，记录未登录用户操作） |
| username | VARCHAR(50) | 用户名（冗余字段，方便查询） |
| action | VARCHAR(50) | 操作类型：login, logout, create, update, delete, view |
| module | VARCHAR(50) | 模块名称：auth, user, blog, comment, tag, role, menu, daySentence, upload |
| target_id | INTEGER | 操作目标ID |
| target_name | VARCHAR(200) | 操作目标名称 |
| ip_address | VARCHAR(45) | IP地址（支持IPv6） |
| user_agent | VARCHAR(500) | 用户代理信息 |
| details | TEXT | 详细信息（JSON格式） |
| status | VARCHAR(20) | 操作状态：success, failed, error |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 使用方法

### 1. 记录登录日志

```javascript
const SimpleLogger = require('../utils/logger');

// 成功登录
await SimpleLogger.logLogin(username, req.ip, true, '', req.get('User-Agent'));

// 失败登录
await SimpleLogger.logLogin(username, req.ip, false, '密码错误', req.get('User-Agent'));
```

### 2. 记录登出日志

```javascript
// 用户登出
await SimpleLogger.logLogout(username, req.ip, req.get('User-Agent'));
```

### 3. 记录模块操作

```javascript
// 创建用户
await SimpleLogger.logOperation(
  req.user.id,           // 操作者用户ID
  req.user.username,     // 操作者用户名
  'create',              // 操作类型
  'user',                // 模块名
  newUser.id,            // 目标ID
  newUser.username,      // 目标名称
  req.ip,                // IP地址
  req.get('User-Agent'), // 用户代理
  { email, roles }       // 详细信息
);

// 更新博客
await SimpleLogger.logOperation(
  req.user.id,
  req.user.username,
  'update',
  'blog',
  blog.id,
  blog.title,
  req.ip,
  req.get('User-Agent'),
  { title, content }
);

// 删除评论
await SimpleLogger.logOperation(
  req.user.id,
  req.user.username,
  'delete',
  'comment',
  comment.id,
  `评论: ${comment.content.substring(0, 30)}...`,
  req.ip,
  req.get('User-Agent')
);
```

## API接口

### 1. 获取操作日志列表

```
GET /api/logs/list
```

**查询参数：**
- `username`: 用户名（模糊查询）
- `action`: 操作类型
- `module`: 模块名称
- `ip_address`: IP地址（模糊查询）
- `status`: 操作状态
- `start_date`: 开始日期
- `end_date`: 结束日期
- `pageSize`: 每页数量（默认20）
- `currentPage`: 当前页码（默认1）

**响应示例：**
```json
{
  "code": 200,
  "message": "获取操作日志成功",
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "username": "admin",
        "action": "login",
        "module": "auth",
        "target_id": null,
        "target_name": null,
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0...",
        "status": "success",
        "details": "{}",
        "created_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "total": 100,
    "pageSize": 20,
    "currentPage": 1
  }
}
```

### 2. 获取日志统计信息

```
GET /api/logs/stats
```

**响应示例：**
```json
{
  "code": 200,
  "message": "获取日志统计信息成功",
  "data": {
    "todayCount": 25,
    "recentCount": 150,
    "moduleStats": [
      { "module": "auth", "count": 50 },
      { "module": "user", "count": 30 },
      { "module": "blog", "count": 20 }
    ],
    "actionStats": [
      { "action": "login", "count": 40 },
      { "action": "create", "count": 25 },
      { "action": "update", "count": 20 }
    ]
  }
}
```

### 3. 清理过期日志

```
DELETE /api/logs/clean
```

**请求体：**
```json
{
  "days": 30
}
```

### 4. 导出日志

```
GET /api/logs/export
```

支持与列表接口相同的查询参数，返回CSV格式的日志数据。

## 已集成的模块

目前已在以下模块中集成了操作日志：

1. **认证模块** (`routes/auth.js`)
   - 用户登录/登出
   - 用户注册

2. **用户管理** (`routes/user.js`)
   - 创建用户
   - 更新用户
   - 删除用户

3. **每日一句** (`routes/daySentence.js`)
   - 添加每日一句
   - 更新每日一句
   - 删除每日一句

4. **文件上传** (`routes/upload.js`)
   - 图片上传

## 特点

1. **简单易用**：只需要调用静态方法即可记录日志
2. **数据库存储**：所有日志存储在数据库中，便于查询和管理
3. **完整信息**：记录用户、操作、IP、时间等完整信息
4. **灵活查询**：支持多种条件的组合查询
5. **统计分析**：提供日志统计和分析功能
6. **数据导出**：支持CSV格式导出
7. **自动清理**：支持按天数清理过期日志

## 注意事项

1. 所有日志记录都是异步的，不会影响主业务流程
2. 如果日志记录失败，会在控制台输出错误信息，但不会中断业务
3. 建议定期清理过期日志以保持数据库性能
4. IP地址字段支持IPv6格式
5. details字段存储JSON格式的详细信息，可以根据需要扩展
