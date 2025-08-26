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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
