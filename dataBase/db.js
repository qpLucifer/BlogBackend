const mysql = require('mysql')

const config = require('./config').db
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
if (process.env.NODE_ENV === 'production') {
  Object.assign(config, require('./config').production)
}
if (process.env.NODE_ENV === 'development') {
  Object.assign(config, require('./config').db)
}
module.exports = mysql.createConnection(config)