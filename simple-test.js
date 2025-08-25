// 简单的环境变量测试
console.log('=== 简单环境变量测试 ===');

// 直接测试环境变量
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

// 测试dotenv
console.log('\n=== 测试dotenv ===');
try {
  require('dotenv').config();
  console.log('dotenv加载成功');
  
  console.log('dotenv后 NODE_ENV:', process.env.NODE_ENV);
  console.log('dotenv后 DB_HOST:', process.env.DB_HOST);
  console.log('dotenv后 JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
} catch (error) {
  console.log('dotenv加载失败:', error.message);
}

// 检查.env文件
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');

console.log('\n=== 文件检查 ===');
console.log('当前目录:', process.cwd());
console.log('.env文件存在:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('.env文件内容:');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log(content);
}

console.log('\n=== 测试完成 ===');
