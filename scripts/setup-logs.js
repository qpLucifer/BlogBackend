// scripts/setup-logs.js - 日志系统初始化脚本
const fs = require('fs');
const path = require('path');

// 日志类型和目录配置
const LOG_TYPES = ['error', 'auth', 'business', 'system', 'api', 'security', 'database'];
const LOG_BASE_DIR = path.join(__dirname, '../logs');

/**
 * 创建日志目录结构
 */
function createLogDirectories() {
  console.log('🗂️  正在创建日志目录结构...');
  
  // 创建主日志目录
  if (!fs.existsSync(LOG_BASE_DIR)) {
    fs.mkdirSync(LOG_BASE_DIR, { recursive: true });
    console.log(`✅ 创建主日志目录: ${LOG_BASE_DIR}`);
  }
  
  // 为每种日志类型创建子目录
  LOG_TYPES.forEach(type => {
    const typeDir = path.join(LOG_BASE_DIR, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
      console.log(`✅ 创建日志类型目录: ${type}`);
    }
  });
  
  console.log('✅ 日志目录结构创建完成');
}

/**
 * 创建日志配置文件
 */
function createLogConfig() {
  const configPath = path.join(LOG_BASE_DIR, 'log-config.json');
  
  const config = {
    version: '1.0.0',
    created: new Date().toISOString(),
    types: LOG_TYPES,
    settings: {
      maxFileSize: '20MB',
      maxFiles: '30d',
      compression: true,
      datePattern: 'YYYY-MM-DD'
    },
    description: {
      error: '错误日志 - 记录系统错误和异常',
      auth: '认证日志 - 记录用户登录、登出、权限验证',
      business: '业务日志 - 记录业务操作和流程',
      system: '系统日志 - 记录系统运行状态和信息',
      api: 'API日志 - 记录API请求和响应',
      security: '安全日志 - 记录安全相关事件',
      database: '数据库日志 - 记录数据库操作和查询'
    }
  };
  
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ 创建日志配置文件');
  }
}

/**
 * 创建日志轮转脚本
 */
function createLogRotationScript() {
  const scriptPath = path.join(LOG_BASE_DIR, 'rotate-logs.sh');
  
  const script = `#!/bin/bash
# 日志轮转脚本
# 每天凌晨执行，清理30天前的日志文件

LOG_DIR="${LOG_BASE_DIR}"
DAYS_TO_KEEP=30

echo "开始清理 \${DAYS_TO_KEEP} 天前的日志文件..."

for type_dir in \${LOG_DIR}/*/; do
    if [ -d "\${type_dir}" ]; then
        type_name=\$(basename "\${type_dir}")
        echo "清理 \${type_name} 类型的日志..."
        
        find "\${type_dir}" -name "*.log" -type f -mtime +\${DAYS_TO_KEEP} -delete
        find "\${type_dir}" -name "*.gz" -type f -mtime +\${DAYS_TO_KEEP} -delete
        
        echo "完成清理 \${type_name} 类型的日志"
    fi
done

echo "日志清理完成"
`;
  
  if (!fs.existsSync(scriptPath)) {
    fs.writeFileSync(scriptPath, script);
    // 设置执行权限（在Unix系统上）
    try {
      fs.chmodSync(scriptPath, '755');
    } catch (error) {
      // Windows系统可能不支持chmod
    }
    console.log('✅ 创建日志轮转脚本');
  }
}

/**
 * 创建README文件
 */
function createLogReadme() {
  const readmePath = path.join(LOG_BASE_DIR, 'README.md');
  
  const readme = `# 日志系统说明

## 目录结构

\`\`\`
logs/
├── error/          # 错误日志
├── auth/           # 认证日志
├── business/       # 业务日志
├── system/         # 系统日志
├── api/            # API日志
├── security/       # 安全日志
├── database/       # 数据库日志
├── log-config.json # 日志配置文件
├── rotate-logs.sh  # 日志轮转脚本
└── README.md       # 说明文档
\`\`\`

## 日志类型说明

- **error**: 系统错误和异常信息
- **auth**: 用户认证相关日志（登录、登出、权限验证）
- **business**: 业务操作日志（创建、更新、删除等）
- **system**: 系统运行状态和信息
- **api**: API请求和响应日志
- **security**: 安全相关事件（文件上传、可疑活动等）
- **database**: 数据库操作和查询日志

## 日志格式

所有日志都采用JSON格式存储，包含以下字段：
- \`timestamp\`: 时间戳
- \`level\`: 日志级别
- \`message\`: 日志消息
- \`service\`: 服务名称
- \`type\`: 日志类型
- 其他相关元数据

## 日志轮转

- 每个日志文件最大20MB
- 保留30天的日志文件
- 自动压缩旧日志文件
- 每天按日期创建新的日志文件

## 维护

1. 定期检查日志文件大小
2. 运行 \`rotate-logs.sh\` 脚本清理旧日志
3. 监控磁盘空间使用情况
4. 根据需要调整日志级别和保留策略

## 查看日志

可以使用以下命令查看日志：

\`\`\`bash
# 查看最新的错误日志
tail -f logs/error/error-current.log

# 查看特定日期的日志
cat logs/system/system-2024-01-01.log

# 搜索特定内容
grep "关键词" logs/*/\*.log
\`\`\`
`;
  
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, readme);
    console.log('✅ 创建日志说明文档');
  }
}

/**
 * 主函数
 */
function setupLogs() {
  console.log('🚀 开始初始化日志系统...');
  
  try {
    createLogDirectories();
    createLogConfig();
    createLogRotationScript();
    createLogReadme();
    
    console.log('🎉 日志系统初始化完成！');
    console.log(`📁 日志目录: ${LOG_BASE_DIR}`);
    console.log('📋 支持的日志类型:', LOG_TYPES.join(', '));
    
  } catch (error) {
    console.error('❌ 日志系统初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupLogs();
}

module.exports = {
  setupLogs,
  LOG_TYPES,
  LOG_BASE_DIR
};
