module.exports = {
  apps: [{
    name: 'blog-backend',
    script: './bin/www',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 确保监听所有网络接口
    args: '--env production',
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
