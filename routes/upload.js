const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/auth');
const { checkMenuPermission } = require('../middleware/permissions');
const { success, fail } = require('../utils/response');

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

const upload = multer({ storage });

// 上传图片接口
router.post('/image', checkMenuPermission('博客管理','can_create'), upload.single('file'), (req, res) => {
  if (!req.file) {
    return fail(res, '未上传文件', 400);
  }
  const url = `/images/${req.file.filename}`;
  success(res, { url }, '上传图片成功');
});

module.exports = router; 