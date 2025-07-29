// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');
const { User, Role, RoleMenu, Menu } = require('../models/admin');
const { mergePermissions } = require('../utils/tool');
const { fail } = require('../utils/response');
const { authLogger } = require('../utils/logger');


const authenticate = async (req, res, next) => {
  let token = '';

  try {
    // 从请求头获取token
    token = req.headers.authorization?.split(' ')[1] || '';

    if (!token) {
      return fail(res, '未提供认证令牌', 401);
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户并附加到请求对象
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'is_active'],
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
      authLogger.tokenError(new Error('Invalid user'), req.ip, token);
      return fail(res, '无效用户', 401);
    }

    if (!user.is_active) {
      authLogger.tokenError(new Error('User account disabled'), req.ip, token);
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
    authLogger.tokenError(error, req.ip, token);

    if (error.name === 'TokenExpiredError') {
      return fail(res, '令牌已过期', 401);
    }

    fail(res, '无效令牌', 401);
  }
};

module.exports = authenticate;