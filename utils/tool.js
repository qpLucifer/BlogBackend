let permissionNameObj = {
    can_read:'查看',
    can_create:'创建',
    can_update:'更新',
    can_delete:'删除',
}

function mergePermissions(data) {
    const merged = {};

    data.forEach(item => {
        const { id, name } = item;

        // 如果该ID首次出现，直接存储
        if (!merged[id]) {
            merged[id] = { ...item };
            return;
        }

        // 合并权限字段（逻辑或操作）
        merged[id].can_read ||= item.can_read;
        merged[id].can_create ||= item.can_create;
        merged[id].can_update ||= item.can_update;
        merged[id].can_delete ||= item.can_delete;
    });

    // 转换为数组并返回
    return Object.values(merged);
}

module.exports = {
    permissionNameObj,
    mergePermissions
}