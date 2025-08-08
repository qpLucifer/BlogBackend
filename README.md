# BlogBackend

博客后端API服务，基于Node.js + Express + Sequelize + MySQL，集成了完整的安全防护、性能监控和权限管理系统。

## 🚀 快速开始

### 环境要求

- Node.js 16+
- MySQL 8.0+
- npm 或 yarn

### 安装和配置

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置数据库连接信息
   ```

3. **启动服务**
   ```bash
   npm run dev
   ```

## 📋 可用命令

### 开发命令
- `npm run dev` - 开发模式启动（包含启动前检查）
- `npm run dev:skip-check` - 跳过检查直接启动
- `npm run start` - 生产模式启动
- `npm run pre-start` - 仅运行启动前检查

### 数据库管理
统一的数据库管理命令：`npm run db <子命令>`

- `npm run db check` - 快速检查数据库连接和索引状态
- `npm run db indexes` - 详细的索引分析
- `npm run db fix` - 预览重复索引修复
- `npm run db fix --exec` - 执行重复索引修复
- `npm run db reset` - 重置数据库（删除所有数据）
- `npm run db diagnose` - 全面的数据库诊断
- `npm run db help` - 显示帮助信息

## 🛡️ 安全功能

### 请求频率限制
- **登录限制**: 15分钟内最多5次登录尝试
- **API限制**: 15分钟内最多100次API请求
- **上传限制**: 1分钟内最多10次文件上传

频率限制配置位于 `middleware/security.js`，可根据需要调整窗口时间和最大请求次数。

### 输入验证
- 所有API端点都有Joi验证
- 用户注册/登录/更新验证
- 博客创建/更新验证
- 文件上传安全检查

### 安全头设置
- **内容安全策略**: 控制资源加载来源
- **XSS防护**: 内置XSS过滤器
- **点击劫持防护**: X-Frame-Options设置
- **MIME类型嗅探防护**: X-Content-Type-Options
- **HTTP严格传输安全**: HSTS头部
- **引用策略控制**: Referrer-Policy

Helmet配置位于 `middleware/security.js`，可根据应用需求调整各项安全头设置。

### 安全日志
- 登录/登出日志记录
- 认证失败日志
- 文件上传安全日志
- 可疑活动监控

## 📊 性能监控

### 监控功能
- 实时响应时间监控
- 内存使用监控
- 数据库查询性能监控
- 系统资源监控

### 监控API
- `GET /api/system/health` - 健康检查（公开访问）
- `GET /api/system/status` - 系统状态（需要管理员权限）
- `GET /api/system/stats` - 性能统计（需要管理员权限）
- `POST /api/system/stats/reset` - 重置统计数据（需要管理员权限）

### 日志系统
```
logs/
├── error.log      # 错误日志
├── combined.log   # 综合日志
└── access.log     # 访问日志
```

查看日志：
```bash
# 查看实时日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log
```

## 🔧 故障排除

### "Too many keys specified; max 64 keys allowed" 错误

这是MySQL索引数量超限错误，解决步骤：

1. **检查问题**
   ```bash
   npm run db check
   ```

2. **修复重复索引**
   ```bash
   npm run db fix --exec
   ```

3. **如果仍有问题，重置数据库**
   ```bash
   npm run db reset
   ```

### 其他常见问题

#### 请求被频率限制
```json
{
  "code": 429,
  "message": "请求过于频繁，请稍后再试"
}
```
**解决方案**: 等待限制时间过后再试

#### 输入验证失败
```json
{
  "code": 400,
  "message": "密码必须包含大小写字母和数字"
}
```
**解决方案**: 按照错误提示修正输入

#### 连接问题
- **连接被拒绝**: 检查MySQL服务是否启动
- **访问被拒绝**: 检查数据库用户名密码
- **数据库不存在**: 手动创建数据库或运行 `npm run db reset`

## 📁 项目结构

```
BlogBackend/
├── bin/www              # 启动文件
├── app.js              # 应用主文件
├── models/             # 数据模型
│   ├── index.js        # 数据库配置
│   ├── admin.js        # 用户、角色、菜单模型
│   ├── blog.js         # 博客、标签、评论模型
│   └── blogSentence.js # 每日一句模型
├── routes/             # 路由文件
│   ├── auth.js         # 认证路由
│   ├── user.js         # 用户管理
│   ├── blog.js         # 博客管理
│   ├── upload.js       # 文件上传
│   └── system.js       # 系统监控
├── middleware/         # 中间件
│   ├── auth.js         # 认证中间件
│   ├── security.js     # 安全中间件
│   ├── errorHandler.js # 错误处理
│   └── permissions.js  # 权限检查
├── utils/              # 工具函数
│   ├── validation.js   # 输入验证
│   ├── logger.js       # 日志系统
│   ├── performance.js  # 性能监控
│   └── response.js     # 响应格式
├── scripts/            # 管理脚本
│   ├── db-manager.js   # 数据库管理工具
│   └── pre-start.js    # 启动前检查
└── public/             # 静态文件
```

## 🔒 环境变量

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blogDb
DB_USER=root
DB_PASSWORD=your_password

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# CORS配置
CORS_ORIGIN=http://localhost:3001

# 日志配置
LOG_LEVEL=info

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
```

## 🎯 API接口

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/profile` - 获取用户信息

### 用户管理
- `GET /api/user/users` - 获取用户列表
- `POST /api/user/users` - 创建用户
- `PUT /api/user/users/:id` - 更新用户
- `DELETE /api/user/users/:id` - 删除用户

### 博客管理
- `GET /api/blog` - 获取博客列表
- `POST /api/blog/add` - 创建博客
- `PUT /api/blog/:id` - 更新博客
- `DELETE /api/blog/:id` - 删除博客

### 角色权限管理
- `GET /api/role/roles` - 获取角色列表
- `POST /api/role/roles` - 创建角色
- `PUT /api/role/roles/:id` - 更新角色
- `DELETE /api/role/roles/:id` - 删除角色

### 菜单管理
- `GET /api/menu/menus` - 获取菜单列表
- `POST /api/menu/menus` - 创建菜单
- `PUT /api/menu/menus/:id` - 更新菜单
- `DELETE /api/menu/menus/:id` - 删除菜单

### 标签管理
- `GET /api/tag/tags` - 获取标签列表
- `POST /api/tag/tags` - 创建标签
- `PUT /api/tag/tags/:id` - 更新标签
- `DELETE /api/tag/tags/:id` - 删除标签

### 评论管理
- `GET /api/comment/comments` - 获取评论列表
- `POST /api/comment/comments` - 创建评论
- `PUT /api/comment/comments/:id` - 更新评论
- `DELETE /api/comment/comments/:id` - 删除评论

### 每日一句
- `GET /api/daySentence` - 获取每日一句
- `POST /api/daySentence` - 创建每日一句
- `PUT /api/daySentence/:id` - 更新每日一句
- `DELETE /api/daySentence/:id` - 删除每日一句

### 文件上传
- `POST /api/upload/image` - 上传图片

### 系统监控
- `GET /api/system/health` - 健康检查
- `GET /api/system/status` - 系统状态
- `GET /api/system/stats` - 性能统计
- `POST /api/system/stats/reset` - 重置统计

## 🛡️ 权限系统

项目实现了基于角色的权限控制（RBAC）：

- **用户** ↔ **角色** (多对多关系)
- **角色** ↔ **菜单** (多对多关系，包含CRUD权限)
- 支持菜单层级结构
- 支持细粒度权限控制（创建、读取、更新、删除）

### 权限检查
- `checkRole(roleName)` - 检查用户角色
- `checkPermission(permission)` - 检查用户权限
- `checkMenuPermission(menuName, action)` - 检查菜单权限

## 📊 数据库优化

项目针对MySQL索引限制进行了全面优化：

### 索引优化策略
- **手动控制索引创建** - 避免Sequelize自动生成过多索引
- **复合索引优先** - 使用复合索引提高查询效率
- **禁用自动约束** - 在关联关系中设置`constraints: false`
- **精确命名** - 为所有索引指定有意义的名称

### 索引配置
- **用户表**: 4个精心设计的索引
- **博客表**: 7个索引（作者、状态、复合索引等）
- **关联表**: 每个3-4个索引（复合唯一索引+外键索引）

### 索引管理工具
- 完整的索引检查和修复工具
- 重复索引自动检测和清理
- 索引使用情况监控

## 🚀 使用示例

### 用户注册
```bash
POST /api/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "Test123456",
  "email": "test@example.com",
  "roles": [1]
}
```

### 用户登录
```bash
POST /api/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "Test123456"
}
```

### 创建博客
```bash
POST /api/blog/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "测试博客",
  "content": "这是博客内容",
  "summary": "博客摘要",
  "author_id": 1,
  "is_published": true,
  "tags": [1, 2]
}
```

### 文件上传
```bash
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

### 健康检查
```bash
GET /api/system/health
```

响应示例：
```json
{
  "code": 200,
  "message": "系统健康检查",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "uptime": "15.25 minutes",
    "memory": {
      "rss": "45.23MB",
      "heapUsed": "32.15MB"
    },
    "version": "1.0.0"
  }
}
```

## 🔍 开发调试

### 日志查看
```bash
# 查看所有日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log

# 过滤特定类型日志
grep "auth" logs/combined.log
grep "Slow request" logs/combined.log
```

### 性能监控
```bash
# 查看系统状态
curl -H "Authorization: Bearer <admin_token>" http://localhost:3000/api/system/status

# 查看性能统计
curl -H "Authorization: Bearer <admin_token>" http://localhost:3000/api/system/stats
```

## 📈 性能优化建议

### 监控指标
- 响应时间 > 500ms 需要关注
- 响应时间 > 1000ms 需要优化
- 内存使用 > 500MB 需要检查
- 错误率 > 5% 需要处理

### 优化措施
- 定期查看性能统计
- 监控慢查询日志
- 及时处理错误日志
- 定期重置统计数据

## 🔧 配置选项

### 自定义配置
可以通过修改相应文件来调整：
- `middleware/security.js` - 安全配置
- `utils/validation.js` - 验证规则
- `utils/performance.js` - 性能监控配置
- `utils/logger.js` - 日志配置

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License

---

**项目特色**:
- ✅ 完整的安全防护体系
- ✅ 实时性能监控
- ✅ 专业级日志系统
- ✅ 数据库索引优化
- ✅ 基于角色的权限控制
- ✅ 统一的错误处理
- ✅ 输入验证和过滤
- ✅ 文件上传安全检查
