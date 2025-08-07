// utils/websocket.js - WebSocket服务管理
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, UserLog } = require('../models/admin');
class WebSocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // 存储已连接的用户
    this.stats = {
      onlineUsers: 0,
      totalBlogs: 0,
      totalViews: 0,
      errorLogs: 0,
      pendingComments: 0,
    };
  }

  // 初始化WebSocket服务器
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('认证失败：未提供令牌'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: ['id', 'username', 'is_active']
        });

        if (!user || !user.is_active) {
          return next(new Error('认证失败：无效用户'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        next();
      } catch (error) {
        next(new Error('认证失败：' + error.message));
      }
    });

    // 连接处理
    this.io.on('connection', async (socket) => {

      // 断开连接处理
      socket.on('disconnect', () => {
        console.log(`用户 ${socket.username} (ID: ${socket.userId}) 已断开连接`);
        this.connectedUsers.delete(socket.userId);
        this.updateOnlineUsers();
      });

      // 心跳检测
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // 处理统计数据请求
      socket.on('requestStats', async () => {
        console.log(`用户 ${socket.username} (ID: ${socket.userId}) 已连接`);

        // 添加到已连接用户列表
        this.connectedUsers.set(socket.userId, {
          socketId: socket.id,
          username: socket.username,
          connectedAt: new Date()
        });

        // 更新在线用户数
        this.updateOnlineUsers();
        const errorLogDataNum = await UserLog.count({
          where: {
            log_type: 'error',
            status: 'failed',
            hasRead: false
          }
        });
        // 更新错误日志数量
        this.updateErrorLogs(errorLogDataNum);

        // 发送当前统计数据
        socket.emit('stats:update', this.stats);
      });
    });

    console.log('✅ WebSocket服务已启动');
  }

  // 更新在线用户数
  updateOnlineUsers() {
    this.stats.onlineUsers = this.connectedUsers.size;
    this.broadcast('stats:onlineUsers', this.stats.onlineUsers);
  }

  // 更新错误日志数量
  updateErrorLogs(errorLogDataNum) {
    this.stats.errorLogs = errorLogDataNum;
    this.broadcast('stats:errorLogs', this.stats.errorLogs);
  }

  // 广播消息给所有连接的用户
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // 发送消息给特定用户
  sendToUser(userId, event, data) {
    const user = this.connectedUsers.get(userId);
    if (user && this.io) {
      this.io.to(user.socketId).emit(event, data);
    }
  }

  // 推送错误日志
  pushErrorLog(errorLogDataNum) {
    this.broadcast('log:error', errorLogDataNum);
  }

  // 推送错误日志数量减少通知
  pushErrorLogDecrease(errorLogDataNum) {
    this.broadcast('log:errorDecrease', errorLogDataNum);
  }

  // 更新博客统计
  updateBlogStats(totalBlogs, totalViews) {
    this.stats.totalBlogs = totalBlogs;
    this.stats.totalViews = totalViews;
    this.broadcast('stats:blogs', {
      totalBlogs: this.stats.totalBlogs,
      totalViews: this.stats.totalViews
    });
  }

  // 推送博客访问量更新
  pushBlogView(blogId, newViewCount) {
    this.broadcast('blog:viewUpdate', {
      blogId,
      viewCount: newViewCount,
      timestamp: new Date().toISOString()
    });
  }

  // 获取当前统计数据
  getStats() {
    return this.stats;
  }

  // 获取在线用户列表
  getOnlineUsers() {
    return Array.from(this.connectedUsers.values()).map(user => ({
      username: user.username,
      connectedAt: user.connectedAt
    }));
  }
}

// 创建单例实例
const wsManager = new WebSocketManager();

module.exports = wsManager;
