let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
const logger = require('./config/winston'); // Import Winston logger
const morgan = require('morgan'); // Keep morgan for middleware setup

// Create a stream for morgan to pipe to winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};
// 加载环境变量
require('dotenv').config();

// 导入安全中间件
const { helmet, helmetConfig, apiLimiter } = require('./middleware/security');
const { getSettings } = require('./utils/settings');

let auth = require('./routes/auth');
let userRouter  = require('./routes/user');
let roleRouter = require('./routes/role');
let menuRouter = require('./routes/menu');
let daySentenceRouter = require('./routes/daySentence');
let blogRouter = require('./routes/blog');
let commentRouter = require('./routes/comment');
let tagRouter = require('./routes/tag');
let uploadRouter = require('./routes/upload');
let logsRouter = require('./routes/logs');
let systemRouter = require('./routes/system');

const { sequelize } = require('./models');
const cors = require('cors');

// 导入新的中间件和工具
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// 基础中间件
app.use(morgan('dev', { stream: morganStream })); // Use morgan with winston stream
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 动态 Helmet：每次请求根据当前设置决定是否应用
const dynamicHelmet = (req, res, next) => {
  if (getSettings().security.helmetEnabled) {
    return helmet(helmetConfig)(req, res, next);
  }
  return next();
};
app.use(dynamicHelmet);

// CORS 必须在限流之前注册，确保预检和错误响应带上CORS头
const corsOptions = {
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（比如同源请求）
    if (!origin) return callback(null, true);

    // 从系统设置动态读取 CORS 白名单
    const allowedOrigins = (getSettings().security.corsOrigins || []).filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS 阻止了来自以下地址的请求:', origin);
      callback(new Error('不允许的 CORS 来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 全局API速率限制（在 CORS 之后）
app.use('/api', apiLimiter);

// 使用auth路由（登录限制已在路由内部配置）
app.use('/api/', auth);
app.use('/api/user', userRouter);
app.use('/api/role', roleRouter);
app.use('/api/menu', menuRouter);
app.use('/api/daySentence', daySentenceRouter);
app.use('/api/blog', blogRouter);
app.use('/api/comments', commentRouter);
app.use('/api/tag', tagRouter);
// 上传路由
app.use('/api/upload', uploadRouter);
app.use('/api/logs', logsRouter);
app.use('/api/system', systemRouter);


// 404错误处理
app.use(notFoundHandler);

// 全局错误处理
app.use(globalErrorHandler);

// 数据库连接和同步
const initDatabase = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    logger.info('✅ 数据库连接成功');

    // 同步数据库模型
    await sequelize.sync({
      alter: true,
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
    logger.info('✅ 数据库同步成功');

    // 初始化角色和权限
    require('./utils/initRoles')();

    // 加载系统设置（持久化）
    const { loadFromDb } = require('./utils/settings');
    const { refreshLimiters } = require('./middleware/security');
    await loadFromDb();
    refreshLimiters();
    logger.info('✅ 初始数据加载完成');

  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error.message);

    // 针对索引超限错误的特殊处理
    if (error.message.includes('Too many keys')) {
      logger.error('🔧 检测到索引超限错误，请运行以下命令修复:');
      logger.error('   npm run db check     # 检查索引状态');
      logger.error('   npm run db fix --exec # 修复重复索引');
      logger.error('   npm run db reset     # 重置数据库（删除数据）');
    }

    // 生产环境下退出进程
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// 启动数据库初始化（异步执行，不阻塞应用启动）
initDatabase().catch(logger.error);

// 启动统计服务
const statsService = require('./utils/statsService');
setTimeout(() => {
  statsService.start();
}, 5000); // 延迟5秒启动，确保数据库连接已建立

module.exports = app;
