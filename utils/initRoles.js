// utils/initRoles.js - 初始化角色和权限
module.exports = async function() {
  const { Role, User, Menu } = require('../models/admin');
  const { registerUser } = require('./auth');
  const { BlogSentence } = require('../models/blogSentence');
  
  // 菜单配置常量
  const MENU_CONFIG = [
    { name: '首页', path: '/dashboard', icon: 'HomeOutlined', order: 1 },
    { name: '博客管理', path: '/blogs', icon: 'FileTextOutlined', order: 2 },
    { name: '评论管理', path: '/comments', icon: 'CommentOutlined', order: 3 },
    { name: '标签管理', path: '/tags', icon: 'TagOutlined', order: 4 },
    { name: '用户管理', path: '/users', icon: 'UserOutlined', order: 5 },
    { name: '角色管理', path: '/roles', icon: 'TeamOutlined', order: 6 },
    { name: '菜单管理', path: '/menus', icon: 'MenuOutlined', order: 7 },
    { name: '每日一句', path: '/day-sentence', icon: 'BulbOutlined', order: 8 }
  ];

  // 角色配置常量
  const ROLE_CONFIG = [
    { name: 'admin', description: '系统管理员' },
    { name: 'editor', description: '内容编辑' },
    { name: 'user', description: '普通用户' }
  ];

  // 用户配置常量
  const USER_CONFIG = [
    { username: 'admin', password: '123456', email: 'admin@example.com', roles: ['admin'] },
    { username: 'editor', password: '123456', email: 'editor@example.com', roles: ['editor'] },
    { username: 'user', password: '123456', email: 'user@example.com', roles: ['user'] }
  ];
  
  try {
    // 检查是否已初始化
    const adminInit = await Role.findOne({ where: { name: 'admin' } });
    if (adminInit) return;
    
    // 创建角色
    const roles = {};
    for (const roleConfig of ROLE_CONFIG) {
      roles[roleConfig.name] = await Role.create({
        name: roleConfig.name,
        description: roleConfig.description
      });
    }

    // 创建用户
    for (const userConfig of USER_CONFIG) {
      const roleIds = userConfig.roles.map(roleName => roles[roleName].id);
      await registerUser(userConfig.username, userConfig.password, userConfig.email, true, roleIds);
    }

    // 创建菜单
    const menus = await Menu.bulkCreate(MENU_CONFIG);
    
    // 分配菜单给admin角色,并分配权限
    await roles.admin.setMenus(menus, {
      through: {
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: true
      }
    });

    // 分配部分菜单给editor角色
    const editorMenus = menus.filter(menu => 
      ['博客管理', '评论管理', '标签管理', '每日一句'].includes(menu.name)
    );
    await roles.editor.setMenus(editorMenus, {
      through: {
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: false
      }
    });

    // 分配只读菜单给user角色
    const userMenus = menus.filter(menu => 
      ['首页', '博客管理', '评论管理', '标签管理'].includes(menu.name)
    );
    await roles.user.setMenus(userMenus, {
      through: {
        can_create: false,
        can_read: true,
        can_update: false,
        can_delete: false
      }
    });

    console.log('角色和权限初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
    throw error;
  }
};