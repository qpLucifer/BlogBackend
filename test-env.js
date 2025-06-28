// 测试dotenv是否正常工作
require('dotenv').config();

console.log('=== 测试环境变量 ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('===================');

// 检查.env文件内容
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('Env文件路径:', envPath);
console.log('Env文件是否存在:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('Env文件内容:');
  console.log(fs.readFileSync(envPath, 'utf8'));
} 