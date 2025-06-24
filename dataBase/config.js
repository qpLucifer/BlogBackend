
module.exports = {
  db: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'moneyroc',
  },
  // 如果需要根据环境区分配置，可以使用 process.env.NODE_ENV
  // 可以添加其他环境的配置
  production: {
    host: 'prod-db-host',
    port: 3306,
    user: 'prod-user',
    password: 'prod-password',
    database: 'prod-blogdb',
  },
  development: {
    host: 'dev-db-host',
    port: 3306,
    user: 'dev-user',
    password: 'dev-password',
    database: 'dev-blogdb',
  },
}
