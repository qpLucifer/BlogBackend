# GitHub Secrets 设置说明

## 概述
本项目使用GitHub Secrets来管理敏感的环境变量，避免在代码中暴露敏感信息。

## 需要在GitHub Secrets中设置的变量

在你的GitHub仓库中，进入 `Settings` > `Secrets and variables` > `Actions`，然后添加以下secrets：

### 必需的Secrets

| Secret名称 | 描述 | 示例值 |
|-----------|------|--------|
| `SERVER_IP` | 服务器IP地址 | `39.104.13.43` |
| `SSH_USERNAME` | SSH用户名 | `root` |
| `SSH_PRIVATE_KEY` | SSH私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `TARGET_DIR` | 服务器上的目标目录 | `/var/www/blog-backend` |

### 数据库配置
| Secret名称 | 描述 | 示例值 |
|-----------|------|--------|
| `DB_HOST` | 数据库主机地址 | `39.104.13.43` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_NAME` | 数据库名称 | `blogDb` |
| `DB_USER` | 数据库用户名 | `blog_user` |
| `DB_PASSWORD` | 数据库密码 | `your_password_here` |

### 应用配置
| Secret名称 | 描述 | 示例值 |
|-----------|------|--------|
| `PORT` | 应用端口 | `3000` |
| `JWT_SECRET` | JWT密钥 | `your_jwt_secret_key` |
| `JWT_EXPIRES_IN` | JWT过期时间 | `1d` |
| `CORS_ORIGIN` | CORS允许的源 | `https://www.jiayizhou.top:3001` |

## 设置步骤

1. 进入你的GitHub仓库
2. 点击 `Settings` 标签
3. 在左侧菜单中点击 `Secrets and variables` > `Actions`
4. 点击 `New repository secret` 按钮
5. 为每个变量添加名称和值
6. 点击 `Add secret` 保存

## 注意事项

- **安全性**: 这些secrets在GitHub Actions日志中会被自动隐藏
- **权限**: 只有仓库管理员和协作者可以查看和编辑secrets
- **更新**: 如果需要更新某个secret，直接编辑即可，无需删除重建
- **删除**: 删除secret后，相关的部署可能会失败

## 验证设置

设置完成后，推送代码到main分支，GitHub Actions会自动：
1. 使用这些secrets创建动态的 `start-with-env.js` 文件（包含所有环境变量）
2. 创建简化的 `ecosystem.config.js` 文件
3. 部署应用到服务器
4. 启动PM2服务

你可以在Actions标签页中查看部署日志，确认环境变量是否正确设置。

## 工作原理

- **项目中的 `start-with-env.js`**：只包含环境变量检查逻辑，不包含敏感信息
- **服务器上的 `start-with-env.js`**：在部署时动态生成，包含从GitHub Secrets读取的所有环境变量
- **安全性**：敏感信息只存在于GitHub Secrets中，不会出现在代码仓库里
