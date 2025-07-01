let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
// 加载环境变量
require('dotenv').config();

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let daySentenceRouter = require('./routes/daySentence');
let adminRouter  = require('./routes/admin');
let auth = require('./routes/auth');
let menuRouter = require('./routes/menu');
const { sequelize } = require('./models');
const cors = require('cors');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（比如同源请求）
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3001',  // React 开发服务器
      'http://localhost:3000',  // 如果前端也在 3000 端口
      process.env.CORS_ORIGIN   // 环境变量中的域名
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS 阻止了来自以下地址的请求:', origin);
      callback(new Error('不允许的 CORS 来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/', auth);
app.use('/api/users', usersRouter);
// app.use('/login', auth);
app.use('/api/admin', adminRouter);
app.use('/api/daySentence', daySentenceRouter);
app.use('/api/menu', menuRouter);
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
