// utils/initRoles.js - 初始化角色和权限
module.exports = async function() {
  const { Role, Permission, UserRole, User } = require('../models/admin');
  const { registerUser } = require('./auth');
  
  try {
    // 检查是否已初始化
    const adminInit = await Role.findOne({ where: { name: 'admin' } });
    if (adminInit) return;

    // 创建权限
    const permissions = await Permission.bulkCreate([
      { name: 'user:read', description: '查看用户信息' },
      { name: 'user:write', description: '管理用户' },
      { name: 'role:manage', description: '管理角色' },
      { name: 'content:read', description: '查看内容' },
      { name: 'content:write', description: '管理内容' }
    ]);
    
    // 创建角色
    const adminRole = await Role.create({
      name: 'admin',
      description: '系统管理员'
    });
    
    const editorRole = await Role.create({
      name: 'editor',
      description: '内容编辑'
    });
    
    const userRole = await Role.create({
      name: 'user',
      description: '普通用户'
    });

    // 创建用户
    await registerUser('admin', '123456'); // 管理员用户
    await registerUser('editor', '123456'); // 编辑用户
    await registerUser('user', '123456'); // 普通用户  

    // 分配角色给用户
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    const editorUser = await User.findOne({ where: { username: 'editor' } });
    const normalUser = await User.findOne({ where: { username: 'user' } });
    if (adminUser) {
      await adminUser.addRole(adminRole);
    }
    if (editorUser) {
      await editorUser.addRole(editorRole);
    }
    if (normalUser) {
      await normalUser.addRole(userRole);
    }
    
    // 分配权限
    await adminRole.addPermissions(permissions);
    await editorRole.addPermissions(permissions.filter(p => 
      p.name.startsWith('content:') || p.name === 'user:read'
    ));
    await userRole.addPermissions(permissions.filter(p => 
      p.name === 'content:read' || p.name === 'user:read'
    ));
    
    console.log('角色和权限初始化完成');
  } catch (error) {
    console.error('初始化角色和权限失败:', error);
  }
};