// 测试环境变量加载
console.log('=== 环境变量测试 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

// 测试dotenv加载
console.log('\n=== 测试dotenv加载 ===');
require('dotenv').config();
console.log('dotenv加载后 NODE_ENV:', process.env.NODE_ENV);
console.log('dotenv加载后 PORT:', process.env.PORT);
console.log('dotenv加载后 DB_HOST:', process.env.DB_HOST);
console.log('dotenv加载后 DB_NAME:', process.env.DB_NAME);
console.log('dotenv加载后 JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('dotenv加载后 CORS_ORIGIN:', process.env.CORS_ORIGIN);

console.log('\n=== 所有环境变量 ===');
console.log(process.env);
