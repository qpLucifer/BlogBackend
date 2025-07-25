// utils/auth.js - 认证工具
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/admin');
const { Role } = require('../models/admin');
const { Menu } = require('../models/admin');
const { buildMenuTree } = require('../utils/tool');

// 密码加密
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// 密码验证
const validatePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      roles: user.Roles ? user.Roles.map(role => role.name) : []
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// 用户注册
const registerUser = async (username, password, email, is_active, role_ids=[]) => {
  if (!role_ids || role_ids.length === 0) {
    throw new Error('请选择用户角色');
  }
  // 注册前校验
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    throw new Error('用户名格式不正确，需3-16位字母、数字或下划线');
  }
  if (password.length < 6) {
    throw new Error('密码长度不能小于6位');
  }
  const hashedPassword = await hashPassword(password);
  // 关联角色
  const roles = await Role.findAll({
    where: {
      id: role_ids
    }
  });
  // 创建用户
  const user = await User.create({ 
    username, 
    password_hash: hashedPassword,
    email,
    is_active
  });
  const addedUser = await User.findOne({ where: { username } });
  // 关联角色
  await addedUser.addRoles(roles);
  return {
    token: generateToken(user),
    user: {
      id: user.id,
      username: user.username,
      roles: roles.map(role => role.name)
    }
  };
};

// 用户登录
const loginUser = async (username, password) => {
  const user = await User.findOne({ 
    where: { username },
    include: [{
      model: Role,
      attributes: ['id', 'name'],
      through: { attributes: [] },
      as: "roles",
      include: [{
        model: Menu,
        attributes: ['id', 'name', 'path', 'icon', 'order', 'parent_id'],
        through: { attributes: ['can_create', 'can_read', 'can_update', 'can_delete'], as: "roleMenu" },
        as: "menus"
      }]
    }]
  });
  if (!user || !(await validatePassword(password, user.password_hash))) {
    throw new Error('用户名或密码错误');
  }
  if (!user.is_active) {
    throw new Error('用户账户已被禁用');
  }

  const roleMenu = [];
  const menus = user.roles.map(role => role.menus).flat();
  menus.forEach(menu => {
    const index = roleMenu.findIndex(m => m.id === menu.id);
    if (menu.roleMenu.can_read && index === -1) {
      roleMenu.push({
        id: menu.id,
        name: menu.name,
        path: menu.path,
        icon: menu.icon,
        order: menu.order,
        parent_id: menu.parent_id,
        can_create: menu.roleMenu.can_create,
        can_read: menu.roleMenu.can_read,
        can_update: menu.roleMenu.can_update,
        can_delete: menu.roleMenu.can_delete,
      })
    }
  });

  // 使用公共函数构建菜单树
  const menusTree = buildMenuTree(roleMenu);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      roles: user.roles.map(role => role.name),
      menus: menusTree
    },
    token: generateToken(user)
  };
};

module.exports = {
  hashPassword,
  validatePassword,
  generateToken,
  registerUser,
  loginUser
};