// 测试环境变量加载
console.log('=== 环境变量测试 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

// 测试dotenv加载
console.log('\n=== 测试dotenv加载 ===');
try {
  require('dotenv').config();
  console.log('dotenv加载成功');
} catch (error) {
  console.log('dotenv加载失败:', error.message);
}

console.log('dotenv加载后 NODE_ENV:', process.env.NODE_ENV);
console.log('dotenv加载后 PORT:', process.env.PORT);
console.log('dotenv加载后 DB_HOST:', process.env.DB_HOST);
console.log('dotenv加载后 DB_NAME:', process.env.DB_NAME);
console.log('dotenv加载后 DB_USER:', process.env.DB_USER);
console.log('dotenv加载后 DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('dotenv加载后 JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('dotenv加载后 CORS_ORIGIN:', process.env.CORS_ORIGIN);

// 检查关键环境变量是否缺失
console.log('\n=== 环境变量检查结果 ===');
const requiredVars = ['NODE_ENV', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ 缺失的环境变量:', missingVars.join(', '));
} else {
  console.log('✅ 所有必需的环境变量都已设置');
}

// 显示当前工作目录和文件
console.log('\n=== 系统信息 ===');
console.log('当前工作目录:', process.cwd());
console.log('Node.js版本:', process.version);
console.log('平台:', process.platform);

// 检查.env文件是否存在
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');
console.log('.env文件存在:', fs.existsSync(envPath));

// 显示所有环境变量（仅显示关键变量，避免敏感信息泄露）
console.log('\n=== 关键环境变量 ===');
const keyVars = ['NODE_ENV', 'PORT', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'CORS_ORIGIN'];
keyVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // 对于敏感信息，只显示前几个字符
    if (varName.includes('PASSWORD') || varName.includes('SECRET')) {
      console.log(`${varName}: ${value.substring(0, 4)}***`);
    } else {
      console.log(`${varName}: ${value}`);
    }
  } else {
    console.log(`${varName}: undefined`);
  }
});
