#!/bin/bash

echo "=== 修复环境变量问题 ==="

# 检查是否以root或www用户运行
if [ "$EUID" -eq 0 ] || [ "$USER" = "www" ]; then
    echo "当前用户: $USER"
else
    echo "警告: 建议以www用户运行此脚本"
fi

# 获取当前目录
CURRENT_DIR=$(pwd)
echo "当前目录: $CURRENT_DIR"

# 备份现有配置
echo "备份现有配置..."
cp ecosystem.config.js ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S)

# 创建新的ecosystem.config.js文件
echo "创建新的PM2配置文件..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'blog-backend',
    script: './bin/www',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // 开发环境配置
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    // 生产环境配置
    env_production: {
      NODE_ENV: 'production',
      DB_DIALECT: 'mysql',
      DB_HOST: '39.104.13.43',
      DB_PORT: 3306,
      DB_NAME: 'blogDb',
      DB_USER: 'blog_user',
      DB_PASSWORD: '7jWW2waA74yZpGEx',
      PORT: 3000,
      JWT_SECRET: 'money_roc_secret_key',
      JWT_EXPIRES_IN: '1d',
      CORS_ORIGIN: 'https://www.jiayizhou.top:3002'
    },
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 进程管理
    min_uptime: '5s',
    max_restarts: 5,
    // 监听配置
    listen_timeout: 5000,
    kill_timeout: 3000
  }]
};
EOF

echo "PM2配置文件已更新"

# 停止现有服务
echo "停止现有PM2服务..."
pm2 stop blog-backend 2>/dev/null || echo "服务未运行"
pm2 delete blog-backend 2>/dev/null || echo "服务未存在"

# 启动服务
echo "启动PM2服务..."
pm2 start ecosystem.config.js --env production --only blog-backend

# 保存PM2配置
echo "保存PM2配置..."
pm2 save

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查服务状态
echo "=== 检查服务状态 ==="
pm2 status

# 检查环境变量
echo "=== 检查环境变量 ==="
node test-env.js

# 检查端口监听
echo "=== 检查端口监听 ==="
netstat -tlnp | grep :3000 || echo "端口3000未监听"

# 检查PM2环境变量
echo "=== 检查PM2环境变量 ==="
pm2 env blog-backend

echo "=== 修复完成 ==="
echo "如果环境变量仍然有问题，请检查："
echo "1. PM2是否正确启动"
echo "2. 应用是否正确加载了环境变量"
echo "3. 数据库连接是否正常"
