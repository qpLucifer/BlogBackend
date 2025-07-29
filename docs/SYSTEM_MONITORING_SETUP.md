# 系统监控模块设置指南

## 📋 概述

本指南将帮助您设置和使用新添加的系统监控功能，包括：
- 📊 **日志管理** - 查看、搜索、下载和管理系统日志
- 🚀 **性能监控** - 实时监控系统性能和API响应时间

## 🚀 快速开始

### 1. 后端设置

#### 添加菜单到数据库
```bash
# 方法1: 使用npm脚本（推荐）
cd BlogBackend
npm run add-system-menus

# 方法2: 手动执行SQL
# 在MySQL中执行 BlogBackend/sql/add_system_menus.sql
```

#### 重启后端服务
```bash
npm run dev
# 或
npm start
```

### 2. 前端设置

前端代码已经准备就绪，包括：
- ✅ 路由配置
- ✅ 页面组件
- ✅ API接口

重新登录前端系统即可看到新菜单。

## 📊 功能详解

### 日志管理功能

#### 主要特性
- 📁 **文件列表** - 查看所有日志文件
- 🔍 **内容搜索** - 按关键词搜索日志内容
- 🏷️ **级别筛选** - 按日志级别（error、warn、info、debug）筛选
- 📥 **文件下载** - 下载完整日志文件
- 🗑️ **自动清理** - 清理过期日志文件
- 📈 **统计信息** - 日志文件统计和分析

#### API端点
```
GET  /api/logs/files          # 获取日志文件列表
GET  /api/logs/content/:filename  # 获取日志内容
GET  /api/logs/download/:filename # 下载日志文件
GET  /api/logs/stats          # 获取日志统计
DELETE /api/logs/clean        # 清理过期日志
```

#### 权限要求
- **查看**: `日志管理.can_read`
- **下载**: `日志管理.can_read`
- **清理**: `日志管理.can_delete`

### 性能监控功能

#### 主要特性
- 🖥️ **实时监控** - CPU、内存、磁盘使用率
- 📊 **性能趋势** - 历史性能数据图表
- 🌐 **API统计** - 各路由响应时间统计
- ⚡ **缓存监控** - 缓存命中率和效率
- 🔄 **自动刷新** - 30秒自动更新数据
- 📈 **健康检查** - 系统健康状态监控

#### API端点
```
GET  /api/performance/realtime    # 实时性能数据
GET  /api/performance/history     # 历史性能数据
GET  /api/performance/api-stats   # API响应时间统计
GET  /api/performance/errors      # 错误统计
GET  /api/performance/cache       # 缓存统计
GET  /api/performance/trends      # 性能趋势数据
POST /api/performance/reset       # 重置统计数据
```

#### 权限要求
- **查看**: `性能监控.can_read`
- **重置统计**: `性能监控.can_update`

## 🔧 配置说明

### 日志配置

日志文件默认存储在 `BlogBackend/logs/` 目录下：
```
logs/
├── error.log      # 错误日志
├── auth.log       # 认证日志
├── business.log   # 业务日志
└── system.log     # 系统日志
```

### 性能监控配置

性能监控使用内存存储，重启服务后数据会重置。如需持久化，可以：
1. 配置Redis存储
2. 定期写入数据库
3. 使用外部监控系统

## 🎯 使用场景

### 日志管理
- 🐛 **故障排查** - 快速定位错误日志
- 🔐 **安全审计** - 查看登录和权限日志
- 📊 **业务分析** - 分析业务操作日志
- 🧹 **存储管理** - 定期清理过期日志

### 性能监控
- 🚨 **性能告警** - 监控系统资源使用
- 📈 **容量规划** - 分析历史性能趋势
- ⚡ **优化指导** - 识别慢接口和瓶颈
- 🔍 **问题诊断** - 实时查看系统状态

## 🛠️ 自定义扩展

### 添加新的日志类型
1. 在 `utils/logger.js` 中添加新的logger
2. 在日志管理页面添加新的类型筛选
3. 更新API接口支持新类型

### 添加新的性能指标
1. 在 `utils/performance.js` 中添加新的监控指标
2. 在性能监控页面添加新的图表
3. 更新API接口返回新数据

### 集成外部监控
- **Prometheus** - 添加metrics端点
- **Grafana** - 创建仪表板
- **ELK Stack** - 日志聚合分析
- **APM工具** - 应用性能监控

## 🔒 安全注意事项

1. **权限控制** - 确保只有管理员能访问敏感日志
2. **日志脱敏** - 避免记录敏感信息（密码、token等）
3. **文件安全** - 限制日志文件下载权限
4. **数据保护** - 定期备份重要日志

## 📞 故障排除

### 常见问题

#### 1. 菜单不显示
- 检查数据库菜单是否正确添加
- 确认用户角色有相应权限
- 重新登录刷新权限

#### 2. 日志文件读取失败
- 检查logs目录权限
- 确认文件路径正确
- 查看后端错误日志

#### 3. 性能数据不更新
- 检查自动刷新是否开启
- 确认API接口正常
- 查看浏览器控制台错误

### 调试命令
```bash
# 检查日志目录
ls -la BlogBackend/logs/

# 测试API接口
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/logs/files

# 查看服务状态
npm run dev
```

## 🎉 完成！

现在您已经成功设置了完整的系统监控功能！

- 📊 访问 `/system/logs` 管理日志
- 🚀 访问 `/system/performance` 监控性能

如有问题，请查看控制台日志或联系技术支持。
