// utils/initRoles.js - 初始化角色和权限
module.exports = async function() {
  const { Role, User, Menu } = require('../models/admin');
  const { registerUser } = require('./auth');
  
  // 菜单配置常量
  const MENU_CONFIG = [
    { name: '首页', path: '/dashboard', icon: 'HomeOutlined', order: 1 },
    { name: '每日一句', path: '/day-sentence', icon: 'BulbOutlined', order: 10 },
    { name: '博客管理', path: '/blogsManage', icon: 'FileTextOutlined', order: 2 },
    { name: '博客列表', path: '/blogsManage/blogs', icon: 'FileTextOutlined', order: 3 },
    { name: '评论管理', path: '/blogsManage/comments', icon: 'CommentOutlined', order: 4 },
    { name: '标签管理', path: '/blogsManage/tags', icon: 'TagOutlined', order: 5 },
    { name: '用户管理', path: '/system/users', icon: 'UserOutlined', order: 7 },
    { name: '角色管理', path: '/system/roles', icon: 'TeamOutlined', order: 8 },
    { name: '菜单管理', path: '/system/menus', icon: 'MenuOutlined', order: 9 },
    { name: '日志管理', path: '/system/logs', icon: 'FileTextOutlined', order: 12 },
    { name: '性能监控', path: '/system/performance', icon: 'DashboardOutlined', order: 13 },
    { name: '系统设置', path: '/system/settings', icon: 'SettingOutlined', order: 15 },
    { name: '系统管理', path: '/system', icon: 'SettingOutlined', order: 14 },
    { name: '个人中心', path: '/profile', icon: 'UserOutlined', order: 11 },
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

    //分配父菜单
    const systemMenu = await Menu.findOne({ where: { name: '系统管理' } });
    const logsMenu = await Menu.findOne({ where: { name: '日志管理' } });
    const performanceMenu = await Menu.findOne({ where: { name: '性能监控' } });
    const menusMenu = await Menu.findOne({ where: { name: '菜单管理' } });
    const usersMenu = await Menu.findOne({ where: { name: '用户管理' } });
    const rolesMenu = await Menu.findOne({ where: { name: '角色管理' } });
  const systemSettingsMenu = await Menu.findOne({ where: { name: '系统设置' } });

    const blogsManageMenu = await Menu.findOne({ where: { name: '博客管理' } });
    const blogsMenu = await Menu.findOne({ where: { name: '博客列表' } });
    const commentsMenu = await Menu.findOne({ where: { name: '评论管理' } });
    const tagsMenu = await Menu.findOne({ where: { name: '标签管理' } });

    await blogsMenu.update({ parent_id: blogsManageMenu.id });
    await commentsMenu.update({ parent_id: blogsManageMenu.id });
    await tagsMenu.update({ parent_id: blogsManageMenu.id });

    await logsMenu.update({ parent_id: systemMenu.id });
    await performanceMenu.update({ parent_id: systemMenu.id });
    await menusMenu.update({ parent_id: systemMenu.id });
    await usersMenu.update({ parent_id: systemMenu.id });
    await rolesMenu.update({ parent_id: systemMenu.id });
  await systemSettingsMenu.update({ parent_id: systemMenu.id });

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