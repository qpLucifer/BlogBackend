// routes/system.js - 系统设置接口
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { getSettings, updateSettings } = require('../utils/settings');
const { refreshLimiters } = require('../middleware/security');
const { success, fail } = require('../utils/response');
const { catchAsync } = require('../middleware/errorHandler');

// 需要认证
router.use(authenticate);

// 获取系统设置
router.get('/settings', checkMenuPermission('系统设置','can_read'), (req, res) => {
  success(res, getSettings(), '获取系统设置成功');
});

// 更新系统设置
router.put('/settings', checkMenuPermission('系统设置','can_update'), catchAsync(async (req, res) => {
  try {
    const newSettings = updateSettings(req.body || {});
    // 若有速率限制相关变更，刷新 limiter 实例
    refreshLimiters();
    success(res, newSettings, '更新系统设置成功');
  } catch (e) {
    fail(res, e.message || '更新系统设置失败', 400);
  }
}));

module.exports = router;

