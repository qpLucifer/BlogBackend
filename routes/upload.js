const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { success, fail } = require('../utils/response');

// 导入安全中间件
const { catchAsync } = require('../middleware/errorHandler');
const SimpleLogger = require('../utils/logger');

const router = express.Router();

// 需要认证
router.use(authenticate);


// 确保 images 目录存在
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 上传图片接口
router.post('/image',
  checkMenuPermission('博客管理','can_create'),
  upload.single('file'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      return fail(res, '未上传文件', 400);
    }

    // 记录上传日志
    await SimpleLogger.logOperation(
      req.user.id,
      req.user.username,
      'create',
      'upload',
      null,
      req.file.filename,
      req.ip,
      req.get('User-Agent'),
      {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      'operation',
      'success'
    );

    const url = `/images/${req.file.filename}`;
    success(res, { url }, '上传图片成功');
  })
);

module.exports = router; 