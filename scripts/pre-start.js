#!/usr/bin/env node

/**
 * 启动前检查脚本
 * 在应用启动前进行必要的检查和准备工作
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { setupLogs } = require('./setup-logs');

console.log('🚀 启动前检查...\n');

// 1. 检查必需的环境变量
function checkRequiredEnvs() {
  console.log('📋 检查必需的环境变量...');
  
  const required = [
    'DB_HOST',
    'DB_NAME', 
    'DB_USER',
    'JWT_SECRET'
  ];
  
  const missing = [];
  
  required.forEach(env => {
    if (!process.env[env]) {
      missing.push(env);
      console.log(`   ❌ ${env}: 未设置`);
    } else {
      console.log(`   ✅ ${env}: 已设置`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n❌ 缺少必需的环境变量:', missing.join(', '));
    console.log('💡 请检查 .env 文件或参考 .env.example');
    return false;
  }
  
  console.log('   ✅ 所有必需的环境变量都已设置');
  return true;
}

// 2. 检查.env文件
function checkEnvFile() {
  console.log('\n📄 检查.env文件...');
  
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env文件不存在');
    console.log('   💡 请复制 .env.example 为 .env 并配置相应的值');
    return false;
  }
  
  const stats = fs.statSync(envPath);
  console.log(`   ✅ .env文件存在 (${stats.size} bytes)`);
  
  // 检查文件权限
  const mode = stats.mode.toString(8);
  if (mode.endsWith('600') || mode.endsWith('644')) {
    console.log(`   ✅ 文件权限安全 (${mode})`);
  } else {
    console.log(`   ⚠️  文件权限可能不安全 (${mode})`);
    console.log('   💡 建议设置为 600: chmod 600 .env');
  }
  
  return true;
}

// 3. 检查必需的目录和初始化日志系统
function checkDirectories() {
  console.log('\n📁 检查必需的目录...');

  const dirs = [
    'public',
    'public/uploads',
    'logs'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../', dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`   📁 创建目录: ${dir}`);
      fs.mkdirSync(dirPath, { recursive: true });
    } else {
      console.log(`   ✅ 目录存在: ${dir}`);
    }
  });

  // 初始化日志系统
  console.log('\n📝 初始化日志系统...');
  try {
    setupLogs();
    console.log('   ✅ 日志系统初始化完成');
  } catch (error) {
    console.log('   ❌ 日志系统初始化失败:', error.message);
    return false;
  }

  return true;
}

// 4. 检查端口可用性
function checkPort() {
  console.log('\n🔌 检查端口可用性...');
  
  const port = process.env.PORT || 3000;
  console.log(`   检查端口: ${port}`);
  
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        console.log(`   ✅ 端口 ${port} 可用`);
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`   ❌ 端口 ${port} 已被占用`);
        console.log('   💡 请更改 PORT 环境变量或停止占用该端口的进程');
        resolve(false);
      } else {
        console.log(`   ❌ 端口检查失败: ${err.message}`);
        resolve(false);
      }
    });
  });
}

// 5. 快速数据库连接测试
async function quickDbTest() {
  console.log('\n🗄️  快速数据库连接测试...');
  
  try {
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectTimeout: 5000,
      acquireTimeout: 5000,
      timeout: 5000
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    
    console.log('   ✅ 数据库连接正常');
    return true;
    
  } catch (error) {
    console.log('   ❌ 数据库连接失败:', error.message);
    
    if (error.message.includes('Too many keys')) {
      console.log('   🔧 检测到 "Too many keys" 错误');
      console.log('   💡 运行 npm run db check 获取详细诊断');
    }
    
    return false;
  }
}

// 6. 生成启动报告
function generateReport(checks) {
  console.log('\n📊 启动检查报告:');
  console.log('================================');
  
  const results = [
    { name: '环境变量', status: checks.env },
    { name: '.env文件', status: checks.envFile },
    { name: '目录结构', status: checks.directories },
    { name: '端口可用性', status: checks.port },
    { name: '数据库连接', status: checks.database }
  ];
  
  results.forEach(result => {
    const icon = result.status ? '✅' : '❌';
    console.log(`   ${icon} ${result.name}`);
  });
  
  const allPassed = results.every(r => r.status);
  
  console.log('================================');
  
  if (allPassed) {
    console.log('🎉 所有检查通过，可以启动应用！');
    console.log('💡 运行 npm run dev 启动开发服务器');
  } else {
    console.log('⚠️  部分检查未通过，请解决上述问题后再启动');
    console.log('💡 运行 npm run diagnose 获取详细诊断信息');
  }
  
  return allPassed;
}

// 主函数
async function main() {
  const checks = {
    env: checkRequiredEnvs(),
    envFile: checkEnvFile(),
    directories: checkDirectories(),
    port: await checkPort(),
    database: await quickDbTest()
  };
  
  const success = generateReport(checks);
  
  console.log('\n🏁 启动前检查完成');
  
  if (!success) {
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 启动前检查失败:', error);
    process.exit(1);
  });
}

module.exports = main;
