// utils/statsService.js - 实时统计服务
const { Blog } = require('../models/blog');
const { sequelize } = require('../models');
const wsManager = require('./websocket');

class StatsService {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  // 启动统计服务
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('📊 实时统计服务已启动');
    
    // 立即更新一次
    this.updateStats();
    
    // 每30秒更新一次统计数据
    this.updateInterval = setInterval(() => {
      this.updateStats();
    }, 30000);
  }

  // 停止统计服务
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('📊 实时统计服务已停止');
  }

  // 更新统计数据
  async updateStats() {
    try {
      // 获取博客总数和总访问量
      const blogStats = await Blog.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalBlogs'],
          [sequelize.fn('SUM', sequelize.col('views')), 'totalViews']
        ],
        raw: true
      });

      const totalBlogs = parseInt(blogStats.totalBlogs) || 0;
      const totalViews = parseInt(blogStats.totalViews) || 0;

      // 通过WebSocket推送更新
      wsManager.updateBlogStats(totalBlogs, totalViews);
      
    } catch (error) {
      console.error('更新统计数据失败:', error);
    }
  }

  // 手动触发博客访问量更新
  async updateBlogView(blogId) {
    try {
      const blog = await Blog.findByPk(blogId, {
        attributes: ['id', 'views']
      });

      if (blog) {
        // 增加访问量
        await blog.increment('views');
        
        // 推送单个博客访问量更新
        wsManager.pushBlogView(blogId, blog.views + 1);
        
        // 触发整体统计更新
        this.updateStats();
      }
    } catch (error) {
      console.error('更新博客访问量失败:', error);
    }
  }

  // 获取当前统计数据
  async getCurrentStats() {
    try {
      const blogStats = await Blog.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalBlogs'],
          [sequelize.fn('SUM', sequelize.col('views')), 'totalViews']
        ],
        raw: true
      });

      const totalBlogs = parseInt(blogStats.totalBlogs) || 0;
      const totalViews = parseInt(blogStats.totalViews) || 0;
      const onlineUsers = wsManager.getStats().onlineUsers;

      return {
        totalBlogs,
        totalViews,
        onlineUsers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalBlogs: 0,
        totalViews: 0,
        onlineUsers: 0,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
const statsService = new StatsService();

module.exports = statsService;
