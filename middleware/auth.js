// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');
const { User, Role, RoleMenu, Menu } = require('../models/admin');
const { mergePermissions } = require('../utils/tool');
const { fail } = require('../utils/response');
const SimpleLogger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  let token = '';

  try {
    // 从请求头获取token
    token = req.headers.authorization?.split(' ')[1] || '';

    if (!token) {
      // 记录未提供令牌的安全日志
      await SimpleLogger.logOperation(
        null,
        req.user?.username || 'anonymous',
        'error',
        'auth',
        null,
        `${req.method} ${req.originalUrl}`,
        req.ip,
        req.get('User-Agent') || '',
        { error_type: 'no_token_provided' },
        'security',
        'failed'
      );
      return fail(res, '未提供认证令牌', 401);
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户并附加到请求对象
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'is_active', 'active_token'],
      include: [{
        model: Role,
        attributes: ['id', 'name'],
        through: { attributes: [] },
        as:"roles",
        include: [{
          model: Menu,
          attributes: ['id', 'name'],
          through: { attributes: ['can_read', 'can_create', 'can_update', 'can_delete'] },
          as:"menus",
        }]
      }]
    });

    if (!user) {
      // 记录无效用户的安全日志
      await SimpleLogger.logOperation(
        null,
        'unknown',
        'error',
        'auth',
        null,
        `${req.method} ${req.originalUrl}`,
        req.ip,
        req.get('User-Agent') || '',
        { error_type: 'invalid_user', token_id: decoded.id },
        'security',
        'failed'
      );
      return fail(res, '无效用户', 401);
    }

    if (user.active_token && user.active_token !== token) {
        return fail(res, '您的账号已在别处登录，请重新登录', 401);
    }

    if (!user.is_active) {
      // 记录被禁用用户尝试访问的安全日志
      await SimpleLogger.logOperation(
        user.id,
        user.username,
        'error',
        'auth',
        null,
        `${req.method} ${req.originalUrl}`,
        req.ip,
        req.get('User-Agent') || '',
        { error_type: 'disabled_user_access' },
        'security',
        'failed'
      );
      return fail(res, '用户账户已被禁用', 403);
    }

    req.user = {
      ...user.get({ plain: true }),
    };

    req.menus = user.roles.flatMap(role => role.menus.map(menu => ({
      id: menu.id,
      name: menu.name,
      can_read: menu.RoleMenu.can_read,
      can_create: menu.RoleMenu.can_create,
      can_update: menu.RoleMenu.can_update,
      can_delete: menu.RoleMenu.can_delete,
    })));

    // req.menus去重，并且以有权限的为主，因为可能有多个角色，每个角色菜单都不一样，以有权限的角色为主
    req.menus = mergePermissions(req.menus);
    
    next();
  } catch (error) {
    // 记录令牌验证失败的安全日志
    let errorType = 'invalid_token';
    let errorMessage = '无效令牌';

    if (error.name === 'TokenExpiredError') {
      errorType = 'token_expired';
      errorMessage = '令牌已过期';
    }

    await SimpleLogger.logOperation(
      null,
      req.user?.username || 'anonymous',
      'error',
      'auth',
      null,
      `${req.method} ${req.originalUrl}`,
      req.ip,
      req.get('User-Agent') || '',
      {
        error_type: errorType,
        error_message: error.message,
        token: token ? 'provided' : 'missing'
      },
      'security',
      'failed',
    );

    if (error.name === 'TokenExpiredError') {
      return fail(res, '令牌已过期', 401);
    }

    fail(res, '无效令牌', 401);
  }
};

module.exports = authenticate;