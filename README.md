# BlogBackend

博客后端API服务，基于Node.js + Express + Sequelize + MySQL。

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

- **连接被拒绝**: 检查MySQL服务是否启动
- **访问被拒绝**: 检查数据库用户名密码
- **数据库不存在**: 手动创建数据库或运行 `npm run db reset`

详细的故障排除指南请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

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
├── middleware/         # 中间件
├── utils/              # 工具函数
├── scripts/            # 管理脚本
│   ├── db-manager.js   # 数据库管理工具
│   └── pre-start.js    # 启动前检查
├── docs/               # 文档
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
```

## 🎯 API接口

### 认证相关
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/profile` - 获取用户信息

### 用户管理
- `GET /api/user` - 获取用户列表
- `POST /api/user` - 创建用户
- `PUT /api/user/:id` - 更新用户
- `DELETE /api/user/:id` - 删除用户

### 博客管理
- `GET /api/blog` - 获取博客列表
- `POST /api/blog` - 创建博客
- `PUT /api/blog/:id` - 更新博客
- `DELETE /api/blog/:id` - 删除博客

### 其他接口
- 角色管理: `/api/role`
- 菜单管理: `/api/menu`
- 标签管理: `/api/tag`
- 评论管理: `/api/comments`
- 每日一句: `/api/daySentence`
- 文件上传: `/api/upload`

## 🛡️ 权限系统

项目实现了基于角色的权限控制（RBAC）：

- **用户** ↔ **角色** (多对多)
- **角色** ↔ **菜单** (多对多，包含CRUD权限)
- 支持菜单层级结构
- 支持细粒度权限控制

## 📊 数据库优化

项目针对MySQL索引限制进行了优化：

- 手动控制索引创建，避免自动生成过多索引
- 使用复合索引提高查询效率
- 在关联关系中禁用自动约束
- 提供完整的索引管理工具

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License
