let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
// 加载环境变量
require('dotenv').config();

let auth = require('./routes/auth');
let userRouter  = require('./routes/user');
let roleRouter = require('./routes/role');
let menuRouter = require('./routes/menu');
let daySentenceRouter = require('./routes/daySentence');
let blogRouter = require('./routes/blog');
let commentRouter = require('./routes/comment');
let tagRouter = require('./routes/tag');
let uploadRouter = require('./routes/upload');

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
  allowedHeaders: ['Content-Type', 'Authorization','X-Requested-With','Content-Type']
}));

app.use('/api/', auth);
app.use('/api/user', userRouter);
app.use('/api/role', roleRouter);
app.use('/api/menu', menuRouter);
app.use('/api/daySentence', daySentenceRouter);
app.use('/api/blog', blogRouter);
app.use('/api/blog', commentRouter);
app.use('/api/blog', tagRouter);
app.use('/api/upload', uploadRouter);


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
