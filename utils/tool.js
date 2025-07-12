// 权限名称映射
const permissionNameObj = {
  can_read: '查看',
  can_create: '创建',
  can_update: '更新',
  can_delete: '删除',
};

// 合并权限，以有权限的为主
const mergePermissions = (menus) => {
  const menuMap = new Map();
  
  menus.forEach(menu => {
    if (menuMap.has(menu.id)) {
      const existing = menuMap.get(menu.id);
      // 合并权限，以有权限的为主
      existing.can_create = existing.can_create || menu.can_create;
      existing.can_read = existing.can_read || menu.can_read;
      existing.can_update = existing.can_update || menu.can_update;
      existing.can_delete = existing.can_delete || menu.can_delete;
    } else {
      menuMap.set(menu.id, { ...menu });
    }
  });
  
  return Array.from(menuMap.values());
};

// 构建菜单树的公共函数
const buildMenuTree = (list, parentId = null) => {
  return list
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(item => ({
      ...item,
      children: buildMenuTree(list, item.id)
    }));
};

// 递归查找菜单的公共函数
const findMenuRecursive = (menus, targetPath) => {
  for (const menu of menus) {
    if (menu.path === targetPath) return menu;
    if (menu.children && menu.children.length > 0) {
      const found = findMenuRecursive(menu.children, targetPath);
      if (found) return found;
    }
  }
  return null;
};

module.exports = {
  permissionNameObj,
  mergePermissions,
  buildMenuTree,
  findMenuRecursive
};