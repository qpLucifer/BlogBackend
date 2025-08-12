# BlogBackend

博客后端 API 服务，基于 Node.js + Express + Sequelize + MySQL，集成了完整的安全防护、权限管理和实时统计系统。

## 🚀 快速开始

### 环境要求

  - Node.js 16+
  - MySQL 8.0+
  - npm 或 yarn

### 安装和配置

1.  **安装依赖**

    ```bash
    npm install
    ```

2.  **配置环境变量**
    复制 `.env.example` 文件为 `.env`，并填入您的数据库连接信息和其他配置。

    ```bash
    cp .env.example .env
    # 编辑 .env 文件
    ```

3.  **启动服务**
    开发模式（带启动前检查和热重载）：

    ```bash
    npm run dev
    ```

    生产模式：

    ```bash
    npm run start
    ```

## 📋 可用命令

  - `npm run dev`: 开发模式启动（包含启动前检查）。
  - `npm run dev:skip-check`: 跳过检查直接以开发模式启动。
  - `npm run start`: 生产模式启动。
  - `npm run pre-start`: 仅运行启动前检查。
  - `npm run db <子命令>`: 数据库管理工具，详情见 `scripts/db-manager.js`。

## 🛡️ 安全功能

### 请求频率限制

项目通过 `express-rate-limit` 实现了对不同类型请求的频率限制，配置可运行时更新。

  - **登录限制**: 15分钟内最多5次尝试。
  - **通用API限制**: 15分钟内最多100次请求。
  - **上传限制**: 1分钟内最多10次文件上传。

### 输入验证

  - 所有面向用户的API端点都使用 `Joi` 进行严格的输入验证。
  - 覆盖用户、博客、评论、角色、菜单、标签等所有核心模块的创建和更新操作。

### 安全头设置 (Helmet)

通过 `helmet` 中间件设置了多个HTTP安全头，以增强应用的安全性。

  - 内容安全策略 (CSP)
  - XSS防护
  - 点击劫持防护 (X-Frame-Options)
  - MIME类型嗅探防护
  - HTTP严格传输安全 (HSTS)
  - 以及其他安全头的最佳实践配置。

### CORS 动态白名单

  - 跨域资源共享(CORS)的来源白名单可以从系统设置中动态加载和更新，无需重启服务。

### 安全日志

  - 详细记录认证失败、权限不足、无效令牌等安全相关事件。
  - 所有关键操作均记录操作者IP及User-Agent。

## 📊 实时统计与通知 (WebSocket)

项目使用 `socket.io` 提供实时数据推送功能，增强了后台的交互体验。

### 核心功能

  - **在线用户数统计**: 实时显示当前在线的用户数量。
  - **博客数据更新**: 实时更新博客总数和总浏览量。
  - **错误日志通知**: 当有新的未读错误日志产生时，会实时通知前端。
  - **认证与安全**: WebSocket连接需要通过JWT令牌进行认证。

## 🛡️ 权限系统 (RBAC)

项目实现了基于角色的权限控制（RBAC）：

  - **用户** ↔ **角色** (多对多)。
  - **角色** ↔ **菜单** (多对多，包含CRUD权限)。
  - 中间件 `checkMenuPermission` 用于检查用户对特定菜单的 `can_create`, `can_read`, `can_update`, `can_delete` 权限。

## 🎯 API 接口

### 认证

  - `POST /api/register` - 用户注册
  - `POST /api/login` - 用户登录
  - `POST /api/logout` - 用户登出

### 用户管理

  - `GET /api/user/listPage` - 分页获取用户列表
  - `POST /api/user/users` - 新增用户
  - `PUT /api/user/users/:id` - 更新用户
  - `DELETE /api/user/users/:id` - 删除用户

### 角色管理

  - `GET /api/role/listPage` - 分页获取角色列表
  - `POST /api/role/roles` - 创建角色
  - `PUT /api/role/roles/:id` - 更新角色
  - `DELETE /api/role/roles/:id` - 删除角色

### 菜单管理

  - `GET /api/menu/tree` - 获取菜单树
  - `POST /api/menu` - 创建菜单
  - `PUT /api/menu/:id` - 更新菜单
  - `DELETE /api/menu/:id` - 删除菜单

### 博客管理

  - `GET /api/blog/listPage` - 分页获取博客列表
  - `POST /api/blog/add` - 创建博客
  - `PUT /api/blog/update/:id` - 更新博客
  - `DELETE /api/blog/delete/:id` - 删除博客

### 评论管理

  - `GET /api/comments/listPage` - 分页获取评论列表
  - `POST /api/comments/add` - 创建评论
  - `PUT /api/comments/update/:id` - 更新评论
  - `DELETE /api/comments/delete/:id` - 删除评论

### 标签管理

  - `GET /api/tag/listPage` - 分页获取标签列表
  - `POST /api/tag/add` - 创建标签
  - `PUT /api/tag/update/:id` - 更新标签
  - `DELETE /api/tag/delete/:id` - 删除标签

### 每日一句

  - `GET /api/daySentence/listPage` - 分页获取列表
  - `POST /api/daySentence/add` - 创建每日一句
  - `PUT /api/daySentence/update/:id` - 更新每日一句
  - `DELETE /api/daySentence/delete/:id` - 删除每日一句

### 文件上传

  - `POST /api/upload/image` - 上传图片

### 系统管理

  - `GET /api/logs/list` - 获取操作日志列表
  - `GET /api/logs/stats` - 获取日志统计信息
  - `GET /api/system/settings` - 获取系统设置
  - `PUT /api/system/settings` - 更新系统设置
  - `POST /api/system/settings/reset` - 重置为默认设置

## 📁 项目结构

```
BlogBackend/
├── bin/www              # 启动文件
├── app.js               # 应用主文件
├── models/              # 数据模型 (Sequelize)
├── routes/              # 路由文件
├── middleware/          # 中间件 (认证、安全、错误处理)
├── utils/               # 工具函数 (日志、验证、响应格式化)
├── scripts/             # 管理脚本 (数据库、启动检查)
└── public/              # 静态文件
```