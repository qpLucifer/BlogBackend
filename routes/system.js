// routes/system.js - 系统设置接口
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { getSettings, updateSettings, saveToDb } = require('../utils/settings');
const { refreshLimiters } = require('../middleware/security');
const { success, fail } = require('../utils/response');
const { catchAsync } = require('../middleware/errorHandler');


// 需要认证
router.use(authenticate);

// 获取系统设置（包含持久化的更新时间）
router.get('/settings', checkMenuPermission('系统设置','can_read'), catchAsync(async (req, res) => {
  const { SystemSetting } = require('../models');
  const row = await SystemSetting.findByPk(1);
  const payload = { ...getSettings() };
  if (row) payload._updatedAt = row.updatedAt;
  success(res, payload, '获取系统设置成功');
}));

// 更新系统设置
router.put('/settings', checkMenuPermission('系统设置','can_update'), catchAsync(async (req, res) => {
  // 支持 CORS 白名单为逗号分隔字符串
  const body = { ...req.body };
  if (body.security && typeof body.security.corsOrigins === 'string') {
    body.security.corsOrigins = body.security.corsOrigins.split(',').map(s => s.trim()).filter(Boolean);
  }
  // 乐观并发控制：校验 _updatedAt
  const { SystemSetting } = require('../models');
  const row = await SystemSetting.findByPk(1);
  if (row && body._updatedAt && new Date(body._updatedAt).getTime() !== new Date(row.updatedAt).getTime()) {
    return fail(res, '设置已被他人修改，请刷新后重试', 409);
  }

  const newSettings = updateSettings(body || {});
  await saveToDb();
  // 若有速率限制相关变更，刷新 limiter 实例
  refreshLimiters();

  const freshRow = await SystemSetting.findByPk(1);
  const payload = { ...newSettings };
  if (freshRow) payload._updatedAt = freshRow.updatedAt;
  success(res, payload, '更新系统设置成功');
}));

// 重置为默认值
router.post('/settings/reset', checkMenuPermission('系统设置','can_update'), catchAsync(async (req, res) => {
  const { DEFAULTS } = require('../utils/settings');
  const { updateSettings, saveToDb } = require('../utils/settings');
  updateSettings(DEFAULTS);
  await saveToDb();
  refreshLimiters();
  const { SystemSetting } = require('../models');
  const row = await SystemSetting.findByPk(1);
  const payload = { ...DEFAULTS };
  if (row) payload._updatedAt = row.updatedAt;
  success(res, payload, '已重置为默认设置');
}));

module.exports = router;

