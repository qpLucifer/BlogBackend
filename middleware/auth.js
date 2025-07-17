// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');
const { User, Role, RoleMenu, Menu } = require('../models/admin');
const { mergePermissions } = require('../utils/tool');
const { fail } = require('../utils/response');


const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
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

    
    if (!user) {
      return fail(res, '无效用户', 401);
    }
    
    if (!user.is_active) {
      return fail(res, '用户账户已被禁用', 403);
    }

    req.user = {
      ...user.get({ plain: true }),
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return fail(res, '令牌已过期', 401);
    }
    console.log('认证错误:', error);
    fail(res, '无效令牌', 401);
  }
};

module.exports = authenticate;