#!/usr/bin/env node

/**
 * 数据库管理工具
 * 集成了连接诊断、索引检查、重复索引修复等功能
 */

require('dotenv').config();
const { sequelize } = require('../models');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 显示帮助信息
function showHelp() {
  console.log('🔧 数据库管理工具\n');
  console.log('用法: npm run db <命令>\n');
  console.log('可用命令:');
  console.log('  check      - 检查数据库连接和索引状态');
  console.log('  indexes    - 详细的索引分析');
  console.log('  fix        - 修复重复索引（预览模式）');
  console.log('  fix --exec - 执行重复索引修复');
  console.log('  reset      - 重置数据库（删除所有数据）');
  console.log('  diagnose   - 全面的数据库诊断');
  console.log('  help       - 显示此帮助信息\n');
  console.log('快捷命令:');
  console.log('  npm run db:fix - 直接执行重复索引修复\n');
  console.log('示例:');
  console.log('  npm run db check');
  console.log('  npm run db fix -- --exec');
  console.log('  npm run db:fix');
  console.log('  npm run db reset');
}

// 检查环境变量
function checkEnvVars() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.log('❌ 缺少必需的环境变量:', missing.join(', '));
    return false;
  }
  
  console.log('✅ 环境变量检查通过');
  return true;
}

// 测试基础连接
async function testBasicConnection() {
  console.log('🔌 测试数据库连接...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectTimeout: 10000
    });
    
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ 连接成功 - MySQL版本: ${rows[0].version}`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.log('❌ 连接失败:', error.message);
    return false;
  }
}

// 获取所有索引
async function getAllIndexes() {
  const tables = [
    'blog_users', 'blog_roles', 'blog_user_roles',
    'blog_menus', 'blog_role_menus', 'blog_articles',
    'blog_tags', 'blog_article_tags', 'blog_comments'
  ];
  
  const allIndexes = [];
  let totalCount = 0;
  
  for (const table of tables) {
    try {
      const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
      
      const indexGroups = {};
      indexes.forEach(idx => {
        if (!indexGroups[idx.Key_name]) {
          indexGroups[idx.Key_name] = {
            name: idx.Key_name,
            table: table,
            columns: [],
            unique: idx.Non_unique === 0,
            type: idx.Index_type
          };
        }
        indexGroups[idx.Key_name].columns.push(idx.Column_name);
      });
      
      const tableIndexes = Object.values(indexGroups);
      allIndexes.push(...tableIndexes);
      totalCount += tableIndexes.length;
      
    } catch (error) {
      // 表不存在，跳过
    }
  }
  
  return { allIndexes, totalCount };
}

// 检查重复索引
function findDuplicateIndexes(allIndexes) {
  const duplicates = [];
  const seen = {};
  
  allIndexes.forEach(idx => {
    if (idx.name === 'PRIMARY') return;
    
    const key = `${idx.table}:${idx.columns.join(',')}`;
    if (!seen[key]) {
      seen[key] = [];
    }
    seen[key].push(idx);
  });
  
  Object.values(seen).forEach(group => {
    if (group.length > 1) {
      duplicates.push(group);
    }
  });
  
  return duplicates;
}

// 快速检查命令
async function quickCheck() {
  console.log('🔍 快速数据库检查\n');
  
  // 检查环境变量
  if (!checkEnvVars()) return;
  
  // 检查连接
  if (!(await testBasicConnection())) return;
  
  // 检查索引
  console.log('\n📊 索引状态检查...');
  const { allIndexes, totalCount } = await getAllIndexes();
  const duplicates = findDuplicateIndexes(allIndexes);
  
  console.log(`   总索引数: ${totalCount}`);
  console.log(`   重复索引组: ${duplicates.length}`);
  
  // 状态评估
  if (totalCount >= 60) {
    console.log('🚨 警告: 索引数量接近MySQL限制(64)!');
  } else if (totalCount >= 50) {
    console.log('⚠️  注意: 索引数量较多，建议优化');
  } else {
    console.log('✅ 索引数量正常');
  }
  
  if (duplicates.length > 0) {
    console.log(`⚠️  发现 ${duplicates.length} 组重复索引，建议运行: npm run db fix`);
  }
  
  console.log('\n🎯 建议操作:');
  if (duplicates.length > 0) {
    console.log('   npm run db fix --exec  # 修复重复索引');
  }
  console.log('   npm run db indexes     # 查看详细索引信息');
  console.log('   npm run db diagnose    # 全面诊断');
}

// 详细索引分析
async function analyzeIndexes() {
  console.log('📊 详细索引分析\n');
  
  const { allIndexes, totalCount } = await getAllIndexes();
  const duplicates = findDuplicateIndexes(allIndexes);
  
  // 按表统计
  const tableStats = {};
  allIndexes.forEach(idx => {
    if (!tableStats[idx.table]) {
      tableStats[idx.table] = { total: 0, unique: 0, normal: 0 };
    }
    tableStats[idx.table].total++;
    if (idx.unique) {
      tableStats[idx.table].unique++;
    } else {
      tableStats[idx.table].normal++;
    }
  });
  
  console.log('📋 按表统计:');
  Object.entries(tableStats).forEach(([table, stats]) => {
    console.log(`   ${table}: ${stats.total}个 (唯一${stats.unique}, 普通${stats.normal})`);
  });
  
  console.log(`\n📊 总计: ${totalCount}个索引`);
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  重复索引 (${duplicates.length}组):`);
    duplicates.forEach((group, index) => {
      console.log(`   ${index + 1}. 表${group[0].table}, 列[${group[0].columns.join(',')}]:`);
      group.forEach(idx => {
        console.log(`      - ${idx.name} (${idx.unique ? 'UNIQUE' : 'NORMAL'})`);
      });
    });
  }
}

// 修复重复索引
async function fixDuplicateIndexes(execute = false) {
  console.log(`🔧 ${execute ? '执行' : '预览'}重复索引修复\n`);
  
  const { allIndexes } = await getAllIndexes();
  const duplicates = findDuplicateIndexes(allIndexes);
  
  if (duplicates.length === 0) {
    console.log('✅ 未发现重复索引');
    return;
  }
  
  const toDelete = [];
  
  duplicates.forEach((group, index) => {
    // 选择保留的索引（优先保留唯一索引和名称较短的）
    const keepIndex = group.sort((a, b) => {
      if (a.unique && !b.unique) return -1;
      if (!a.unique && b.unique) return 1;
      return a.name.length - b.name.length;
    })[0];
    
    const deleteIndexes = group.filter(idx => idx.name !== keepIndex.name);
    
    console.log(`📋 重复组 ${index + 1}:`);
    console.log(`   表: ${group[0].table}, 列: [${group[0].columns.join(',')}]`);
    console.log(`   保留: ${keepIndex.name}`);
    
    deleteIndexes.forEach(idx => {
      console.log(`   删除: ${idx.name}`);
      toDelete.push({
        table: idx.table,
        name: idx.name,
        sql: `DROP INDEX \`${idx.name}\` ON \`${idx.table}\``
      });
    });
    console.log('');
  });
  
  if (!execute) {
    console.log('💡 要执行修复，请运行: npm run db fix --exec');
    return;
  }
  
  // 执行删除
  console.log('🔧 开始删除重复索引...');
  let success = 0, failed = 0;
  
  for (const item of toDelete) {
    try {
      await sequelize.query(item.sql);
      console.log(`✅ 删除成功: ${item.table}.${item.name}`);
      success++;
    } catch (error) {
      console.log(`❌ 删除失败: ${item.table}.${item.name} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 修复结果: 成功${success}, 失败${failed}`);
}

// 重置数据库
async function resetDatabase() {
  console.log('🚨 重置数据库 (警告: 将删除所有数据)\n');
  
  try {
    await sequelize.sync({ force: true });
    console.log('✅ 数据库重置成功');
    
    // 初始化角色和权限
    require('../utils/initRoles')();
    console.log('✅ 初始数据创建成功');
    
  } catch (error) {
    console.error('❌ 重置失败:', error.message);
  }
}

// 全面诊断
async function fullDiagnose() {
  console.log('🔍 全面数据库诊断\n');
  
  console.log('1️⃣ 环境检查');
  checkEnvVars();
  
  console.log('\n2️⃣ 连接测试');
  await testBasicConnection();
  
  console.log('\n3️⃣ 索引分析');
  await analyzeIndexes();
  
  console.log('\n4️⃣ 系统信息');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   平台: ${process.platform}`);
  
  try {
    const pkg = require('../package.json');
    console.log(`   Sequelize: ${pkg.dependencies.sequelize}`);
    console.log(`   MySQL2: ${pkg.dependencies.mysql2}`);
  } catch (error) {
    // 忽略
  }
}

// 主函数
async function main() {
  const command = process.argv[2];
  const flags = process.argv.slice(3);

  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  try {
    await sequelize.authenticate();
    
    switch (command) {
      case 'check':
        await quickCheck();
        break;
      case 'indexes':
        await analyzeIndexes();
        break;
      case 'fix':
        await fixDuplicateIndexes(flags.includes('--exec'));
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'diagnose':
        await fullDiagnose();
        break;
      default:
        console.log(`❌ 未知命令: ${command}`);
        showHelp();
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    
    if (error.message.includes('Too many keys')) {
      console.log('\n🔧 检测到索引超限错误!');
      console.log('建议立即执行: npm run db fix --exec');
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { quickCheck, analyzeIndexes, fixDuplicateIndexes, resetDatabase };
