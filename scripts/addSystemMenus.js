// scripts/addSystemMenus.js - 添加系统管理菜单的脚本
const { sequelize } = require('../models');
const { Menu, Role, RoleMenu } = require('../models/admin');

async function addSystemMenus() {
  try {
    console.log('开始添加系统管理菜单...');

    // 1. 查找或创建系统管理父菜单
    let [systemMenu, created] = await Menu.findOrCreate({
      where: { 
        name: '系统管理',
        parent_id: null 
      },
      defaults: {
        name: '系统管理',
        path: '/system',
        icon: 'SettingOutlined',
        parent_id: null,
        order: 100,
        component: null
      }
    });

    if (created) {
      console.log('✅ 创建系统管理父菜单成功');
    } else {
      console.log('ℹ️  系统管理父菜单已存在');
    }

    // 2. 创建日志管理菜单
    let [logsMenu, logsCreated] = await Menu.findOrCreate({
      where: { 
        name: '日志管理',
        parent_id: systemMenu.id 
      },
      defaults: {
        name: '日志管理',
        path: '/system/logs',
        icon: 'FileTextOutlined',
        parent_id: systemMenu.id,
        order: 101,
        component: 'system/logs'
      }
    });

    if (logsCreated) {
      console.log('✅ 创建日志管理菜单成功');
    } else {
      console.log('ℹ️  日志管理菜单已存在');
    }

    // 3. 创建性能监控菜单
    let [performanceMenu, performanceCreated] = await Menu.findOrCreate({
      where: { 
        name: '性能监控',
        parent_id: systemMenu.id 
      },
      defaults: {
        name: '性能监控',
        path: '/system/performance',
        icon: 'DashboardOutlined',
        parent_id: systemMenu.id,
        order: 102,
        component: 'system/performance'
      }
    });

    if (performanceCreated) {
      console.log('✅ 创建性能监控菜单成功');
    } else {
      console.log('ℹ️  性能监控菜单已存在');
    }

    // 4. 查找超级管理员角色（假设名称为'超级管理员'或'admin'）
    const adminRole = await Role.findOne({
      where: {
        name: ['超级管理员', 'admin', 'Administrator']
      }
    });

    if (!adminRole) {
      console.log('⚠️  未找到超级管理员角色，请手动分配权限');
      return;
    }

    console.log(`找到管理员角色: ${adminRole.name} (ID: ${adminRole.id})`);

    // 5. 为管理员角色分配权限
    const menuPermissions = [
      {
        role_id: adminRole.id,
        menu_id: systemMenu.id,
        can_create: false,
        can_read: true,
        can_update: false,
        can_delete: false
      },
      {
        role_id: adminRole.id,
        menu_id: logsMenu.id,
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: true
      },
      {
        role_id: adminRole.id,
        menu_id: performanceMenu.id,
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: false
      }
    ];

    for (const permission of menuPermissions) {
      await RoleMenu.findOrCreate({
        where: {
          role_id: permission.role_id,
          menu_id: permission.menu_id
        },
        defaults: permission
      });
    }

    console.log('✅ 权限分配完成');

    // 6. 显示创建的菜单结构
    console.log('\n📋 菜单结构:');
    const menus = await Menu.findAll({
      where: {
        id: [systemMenu.id, logsMenu.id, performanceMenu.id]
      },
      include: [{
        model: Menu,
        as: 'parent',
        attributes: ['name']
      }],
      order: [['parent_id', 'ASC'], ['order', 'ASC']]
    });

    menus.forEach(menu => {
      const parentName = menu.parent ? menu.parent.name : '根菜单';
      console.log(`  - ${menu.name} (${menu.path}) - 父菜单: ${parentName}`);
    });

    console.log('\n🎉 系统管理菜单添加完成！');
    console.log('\n📝 下一步操作:');
    console.log('1. 重启后端服务');
    console.log('2. 重新登录前端系统');
    console.log('3. 检查菜单是否正确显示');

  } catch (error) {
    console.error('❌ 添加系统管理菜单失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addSystemMenus()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { addSystemMenus };
