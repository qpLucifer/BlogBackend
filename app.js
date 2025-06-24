let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
// app.js or server.js
require('dotenv').config();
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let daySentenceRouter = require('./routes/daySentence');
let adminRouter  = require('./routes/admin');
let auth = require('./routes/auth');
const { sequelize } = require('./models');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', auth);
app.use('/users', usersRouter);
// app.use('/login', auth);
app.use('/admin', adminRouter);
app.use('/daySentence', daySentenceRouter);
// 处理跨域请求
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 允许所有来源
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // 允许的请求方法
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 允许的请求头
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // 对于预检请求，直接返回204状态码
  }
  next();
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 数据库同步
sequelize.sync({ alter: true })
  .then(() => console.log('数据库已同步'))
  .catch(err => console.error('数据库同步失败:', err));

// 初始化角色和权限
require('./utils/initRoles')();
module.exports = app;
