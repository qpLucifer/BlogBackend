#!/bin/bash

echo "=== 手动修复环境变量问题 ==="

# 进入项目目录
cd /www/wwwroot/blog-backend || {
    echo "错误: 无法进入项目目录"
    exit 1
}

echo "当前目录: $(pwd)"

# 1. 创建.env文件
echo "1. 创建.env文件..."
cat > .env << 'EOF'
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=39.104.13.43
DB_PORT=3306
DB_NAME=blogDb
DB_USER=blog_user
DB_PASSWORD=7jWW2waA74yZpGEx
PORT=3000
JWT_SECRET=money_roc_secret_key
JWT_EXPIRES_IN=1d
CORS_ORIGIN=https://www.jiayizhou.top:3002
EOF

echo ".env文件创建完成"

# 2. 更新PM2配置
echo "2. 更新PM2配置..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'blog-backend',
    script: './bin/www',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
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
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    min_uptime: '5s',
    max_restarts: 5,
    listen_timeout: 5000,
    kill_timeout: 3000
  }]
};
EOF

echo "PM2配置更新完成"

# 3. 重启PM2服务
echo "3. 重启PM2服务..."
pm2 kill
pm2 start ecosystem.config.js
pm2 save

echo "PM2服务重启完成"

# 4. 等待服务启动
echo "4. 等待服务启动..."
sleep 10

# 5. 检查结果
echo "5. 检查结果..."
echo "=== PM2状态 ==="
pm2 status

echo "=== 环境变量测试 ==="
node simple-test.js

echo "=== 端口监听 ==="
netstat -tlnp | grep :3000 || echo "端口3000未监听"

echo "=== PM2日志 ==="
pm2 logs blog-backend --lines 5

echo "=== 修复完成 ==="
