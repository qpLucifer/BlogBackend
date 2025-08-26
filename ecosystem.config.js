module.exports = {
  apps: [{
    name: 'blog-backend',
    script: './start-with-env.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DB_DIALECT: 'mysql',
      DB_PORT: 3306,
      JWT_EXPIRES_IN: '1d'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
