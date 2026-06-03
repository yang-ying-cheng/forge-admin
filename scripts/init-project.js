#!/usr/bin/env node

/**
 * 项目初始化脚本
 * 用于基于 forge-admin 模板创建新项目
 *
 * 使用方法: pnpm run init <项目名称> "<项目描述>" <包名> <模块前缀>
 * 示例: pnpm run init lead-ai "营销管理系统" com.lead lead
 */

const fs = require('fs')
const path = require('path')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)

  if (args.length < 4) {
    log('使用方法: pnpm run init <项目名称> "<项目描述>" <包名> <模块前缀>', 'yellow')
    log('示例: pnpm run init lead-ai "营销管理系统" com.lead lead', 'cyan')
    process.exit(1)
  }

  const projectName = args[0]
  const description = args[1]
  const basePackage = args[2]
  const modulePrefix = args[3]

  const nameKebab = projectName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')

  const nameSnake = nameKebab.replace(/-/g, '_')

  return {
    projectName,
    description,
    basePackage,
    modulePrefix,
    nameKebab,
    nameSnake
  }
}

// 验证包名
function validatePackageName(packageName) {
  const regex = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/
  if (!regex.test(packageName)) {
    log('错误: 包名格式不正确，应为: com.example 或 com.company.project', 'red')
    process.exit(1)
  }
}

// 递归获取目录下所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const fullPath = path.join(dirPath, file)

    // 跳过特定目录
    if ([
      'node_modules', 'target', 'dist', '.git', '.idea',
      'logs', 'uploads', '.claude'
    ].includes(file)) {
      return
    }

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

// 替换文件内容
function replaceInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.split(from).join(to)
        modified = true
      }
    })

    if (modified) {
      fs.writeFileSync(filePath, content)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

// 重命名 Java 包目录
function renamePackageDir(oldPackage, newPackage, srcDir) {
  const oldPath = path.join(srcDir, oldPackage.replace(/\./g, '/'))
  const newPath = path.join(srcDir, newPackage.replace(/\./g, '/'))

  if (!fs.existsSync(oldPath)) {
    return false
  }

  // 确保目标父目录存在
  const newParentDir = path.dirname(newPath)
  if (!fs.existsSync(newParentDir)) {
    fs.mkdirSync(newParentDir, { recursive: true })
  }

  // 移动目录
  try {
    fs.cpSync(oldPath, newPath, { recursive: true })
    fs.rmSync(oldPath, { recursive: true })
    log(`  ✓ 重命名包目录: ${oldPackage} -> ${newPackage} (${path.relative(process.cwd(), srcDir)})`, 'green')
    return true
  } catch (error) {
    log(`  ✗ 重命名包目录失败: ${error.message}`, 'red')
    return false
  }
}

// 清理空目录
function cleanEmptyDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return

  const files = fs.readdirSync(dirPath)

  if (files.length === 0) {
    fs.rmdirSync(dirPath)
    cleanEmptyDirs(path.dirname(dirPath))
  } else {
    files.forEach(file => {
      const fullPath = path.join(dirPath, file)
      if (fs.statSync(fullPath).isDirectory()) {
        cleanEmptyDirs(fullPath)
      }
    })
  }
}

// 查找所有 src/main/java 目录
function findJavaSourceRoots(baseDir) {
  const results = []
  const skipDirs = ['node_modules', 'target', 'dist', '.git', '.idea', 'logs', 'uploads', '.claude']

  function walk(dir) {
    const name = path.basename(dir)
    if (skipDirs.includes(name)) return

    if (dir.endsWith(path.join('src', 'main', 'java'))) {
      results.push(dir)
      return
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name))
        }
      }
    } catch (e) {
      // ignore
    }
  }

  walk(baseDir)
  return results
}

// 重命名 Java 子模块目录（最深优先，自底向上）
function renameJavaModules(serverDir, oldPrefix, newPrefix, rootDir) {
  const skipDirs = ['node_modules', 'target', 'dist', '.git', '.idea', 'logs', 'uploads', '.claude']
  const renames = []

  function collectRenames(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory() || skipDirs.includes(entry.name)) continue
        if (entry.name.startsWith(oldPrefix + '-')) {
          const oldPath = path.join(dir, entry.name)
          // 先收集子目录（深度优先），确保从最深层的目录开始重命名
          collectRenames(oldPath)
          renames.push({ from: oldPath, to: path.join(dir, entry.name.replace(oldPrefix, newPrefix)) })
        }
      }
    } catch (e) {
      // ignore
    }
  }

  collectRenames(serverDir)

  renames.forEach(({ from, to }) => {
    if (fs.existsSync(from)) {
      fs.renameSync(from, to)
      log(`  ✓ ${path.relative(rootDir, from)} -> ${path.relative(rootDir, to)}`, 'green')
    }
  })
}

// 主函数
function main() {
  log('\n========================================', 'cyan')
  log('  forge-admin 项目初始化脚本', 'cyan')
  log('========================================\n', 'cyan')

  const config = parseArgs()
  validatePackageName(config.basePackage)

  log('配置信息:', 'yellow')
  log(`  项目名称: ${config.projectName}`)
  log(`  项目描述: ${config.description}`)
  log(`  包名: ${config.basePackage}`)
  log(`  模块前缀: ${config.modulePrefix}`)
  log(`  标识符 (kebab): ${config.nameKebab}`)
  log(`  标识符 (snake): ${config.nameSnake}\n`)

  const rootDir = path.resolve(__dirname, '..')
  process.chdir(rootDir)

  const namePascal = config.nameKebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  const javaPrefix = config.modulePrefix

  // 定义替换规则（顺序重要：先匹配长的字符串，避免部分匹配）
  const replacements = [
    // 后端替换
    { from: 'ForgeAdminApplication', to: `${namePascal}Application` },
    { from: 'com.forge.admin', to: config.basePackage },
    { from: 'com.forge', to: config.basePackage },
    { from: 'forge_admin-page-config', to: `${config.nameSnake}-page-config` },

    // Java 模块名（使用 javaPrefix，长的先匹配）
    { from: 'forge-spring-boot-starter-mybatis', to: `${javaPrefix}-spring-boot-starter-mybatis` },
    { from: 'forge-spring-boot-starter-redis', to: `${javaPrefix}-spring-boot-starter-redis` },
    { from: 'forge-spring-boot-starter-security', to: `${javaPrefix}-spring-boot-starter-security` },
    { from: 'forge-spring-boot-starter-web', to: `${javaPrefix}-spring-boot-starter-web` },
    { from: 'forge-module-system-api', to: `${javaPrefix}-module-system-api` },
    { from: 'forge-module-system-biz', to: `${javaPrefix}-module-system-biz` },
    { from: 'forge-module-system', to: `${javaPrefix}-module-system` },
    { from: 'forge-module-workflow-api', to: `${javaPrefix}-module-workflow-api` },
    { from: 'forge-module-workflow-biz', to: `${javaPrefix}-module-workflow-biz` },
    { from: 'forge-module-workflow', to: `${javaPrefix}-module-workflow` },
    { from: 'forge-dependencies', to: `${javaPrefix}-dependencies` },
    { from: 'forge-framework', to: `${javaPrefix}-framework` },
    { from: 'forge-common', to: `${javaPrefix}-common` },

    // 通用引用
    { from: 'forge-admin', to: config.nameKebab },
    { from: 'forge_admin', to: config.nameSnake },
    { from: '聚能后台管理系统', to: config.description },

    // Maven 模块及目录引用（使用 javaPrefix）
    { from: 'forge-server', to: `${javaPrefix}-server` },
    { from: 'forge-web', to: `${javaPrefix}-web` },

    // Maven 根 artifactId/name（XML 标签内容中的独立模块前缀）
    { from: '>forge<', to: `>${javaPrefix}<` },

    // Maven 版本属性名
    { from: 'forge.version', to: `${javaPrefix}.version` },

    // Spring YAML 配置键及属性引用
    { from: '${forge.', to: `\${${javaPrefix}.` },
    { from: '\nforge:', to: `\n${javaPrefix}:` },
  ]

  // 需要处理的文件扩展名
  const targetExtensions = [
    '.java', '.xml', '.yml', '.yaml', '.properties',
    '.vue', '.ts', '.js', '.json', '.html', '.env', '.sql', '.md',
    '.imports'
  ]
  // 无扩展名但需要处理的文件名
  const targetFilenames = ['Dockerfile']

  log('1. 替换文件内容...', 'yellow')
  const files = getAllFiles('.')
  let replacedCount = 0

  files.forEach(file => {
    const ext = path.extname(file)
    const basename = path.basename(file)
    if (targetExtensions.includes(ext) || targetFilenames.includes(basename) || file.includes('.env')) {
      if (replaceInFile(file, replacements)) {
        replacedCount++
        log(`  ✓ ${file}`, 'green')
      }
    }
  })

  log(`\n  共替换 ${replacedCount} 个文件\n`)

  // 重命名 Java 包目录（自动扫描所有模块）
  log('2. 重命名 Java 包目录...', 'yellow')
  const serverDir = path.join(rootDir, 'apps/forge-server')
  const javaSourceRoots = findJavaSourceRoots(serverDir)

  log(`  发现 ${javaSourceRoots.length} 个 Java 源码根目录`, 'cyan')

  // 先尝试 com.forge.admin（兼容旧模板），再尝试 com.forge（当前包名）
  javaSourceRoots.forEach(javaDir => {
    if (!renamePackageDir('com.forge', config.basePackage, javaDir)) {
      renamePackageDir('com.forge.admin', config.basePackage, javaDir)
    }
  })

  // 清理空目录
  javaSourceRoots.forEach(javaDir => {
    const oldPackagePath = path.join(javaDir, 'com/forge/admin')
    if (fs.existsSync(path.dirname(oldPackagePath))) {
      cleanEmptyDirs(path.dirname(oldPackagePath))
    }
    const oldPackagePath2 = path.join(javaDir, 'com/forge')
    if (fs.existsSync(path.dirname(oldPackagePath2))) {
      cleanEmptyDirs(path.dirname(oldPackagePath2))
    }
  })

  // 重命名启动类文件
  log('\n3. 重命名启动类...', 'yellow')
  const newPackagePath = config.basePackage.replace(/\./g, '/')
  javaSourceRoots.forEach(javaDir => {
    const oldAppFile = path.join(javaDir, newPackagePath, 'ForgeAdminApplication.java')
    if (fs.existsSync(oldAppFile)) {
      const newAppFile = path.join(javaDir, newPackagePath, `${namePascal}Application.java`)
      fs.renameSync(oldAppFile, newAppFile)
      log(`  ✓ ForgeAdminApplication.java -> ${namePascal}Application.java`, 'green')
    }
  })

  // 重命名 Java 子模块目录（在外层目录重命名之前执行）
  log('\n4. 重命名 Java 子模块目录...', 'yellow')
  renameJavaModules(serverDir, 'forge', javaPrefix, rootDir)

  // 重命名应用目录
  log('\n5. 重命名应用目录...', 'yellow')
  const dirRenames = [
    { from: 'forge-server', to: `${javaPrefix}-server` },
    { from: 'forge-web', to: `${javaPrefix}-web` },
  ]
  dirRenames.forEach(({ from, to }) => {
    const oldDir = path.join(rootDir, 'apps', from)
    const newDir = path.join(rootDir, 'apps', to)
    if (fs.existsSync(oldDir) && from !== to) {
      fs.renameSync(oldDir, newDir)
      log(`  ✓ apps/${from} -> apps/${to}`, 'green')
    }
  })

  // 更新数据库初始化脚本
  log('\n6. 更新数据库脚本...', 'yellow')
  const sqlFile = path.join(rootDir, 'sql/init.sql')
  if (fs.existsSync(sqlFile)) {
    replaceInFile(sqlFile, [
      { from: 'forge_admin', to: config.nameSnake }
    ])
    log('  ✓ 更新 sql/init.sql', 'green')
  }

  // 重命名根目录（最后执行）
  log('\n7. 重命名根目录...', 'yellow')
  const currentDirName = path.basename(rootDir)
  const newRootDirName = config.nameKebab
  if (currentDirName !== newRootDirName) {
    const parentDir = path.dirname(rootDir)
    const newRootDir = path.join(parentDir, newRootDirName)
    fs.renameSync(rootDir, newRootDir)
    log(`  ✓ ${currentDirName} -> ${newRootDirName}`, 'green')
  } else {
    log('  - 根目录名称已是目标名称，跳过', 'cyan')
  }

  log('\n========================================', 'cyan')
  log('  初始化完成！', 'green')
  log('========================================\n', 'cyan')

  log('后续步骤:', 'yellow')
  log('  1. 创建数据库: mysql -u root -p < sql/init.sql')
  log('  2. 更新 .env 文件中的配置')
  log(`  3. 启动后端: cd apps/${javaPrefix}-server && mvn spring-boot:run`)
  log(`  4. 启动前端: cd apps/${javaPrefix}-web && pnpm dev`)
  log('')
}

main()
