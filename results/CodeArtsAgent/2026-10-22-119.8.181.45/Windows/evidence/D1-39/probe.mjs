import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(__dirname, '..', '..', '..', '..', 'evidence', 'D1-39');

if (!existsSync(evidenceDir)) {
  mkdirSync(evidenceDir, { recursive: true });
}

const results = {};
const logs = [];

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = '[' + timestamp + '] ' + msg;
  logs.push(line);
  console.log(line);
}

log('=== D1-39 Windows 升级检测链可用性测试 ===');
log('测试环境: Windows, Node ' + process.version);
log('证据目录: ' + evidenceDir);

// 测试1: spawnSync 不带 shell:true
log('--- 测试1: spawnSync npm.cmd 不带 shell:true ---');
try {
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
  });
  
  const hasEINVAL = r1.error && r1.error.code === 'EINVAL';
  
  log('返回码: ' + r1.status);
  log('错误: ' + (r1.error ? r1.error.message : '无'));
  log('错误码: ' + (r1.error ? r1.error.code : 'N/A'));
  
  results.spawnSync_no_shell = {
    status: r1.status,
    error: r1.error ? r1.error.message : null,
    errorCode: r1.error ? r1.error.code : null,
    hasEINVAL: hasEINVAL,
    hasError: r1.error !== null && r1.error !== undefined,
    stdout: r1.stdout ? r1.stdout.substring(0, 500) : null,
    stderr: r1.stderr ? r1.stderr.substring(0, 500) : null
  };
} catch (e) {
  log('异常: ' + e.message);
  results.spawnSync_no_shell = { status: 'EXCEPTION', error: e.message };
}

// 测试2: spawnSync 带 shell:true
log('--- 测试2: spawnSync npm.cmd 带 shell:true ---');
try {
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
    shell: true,
  });
  
  const worksWithShell = r2.status === 0;
  log('返回码: ' + r2.status);
  log('错误: ' + (r2.error ? r2.error.message : '无'));
  
  if (r2.stdout) {
    try {
      const tags = JSON.parse(r2.stdout);
      log('解析成功: latest=' + (tags.latest || 'N/A'));
      results.spawnSync_with_shell = {
        status: r2.status,
        error: r2.error ? r2.error.message : null,
        worksWithShell: worksWithShell,
        stdout: r2.stdout ? r2.stdout.substring(0, 500) : null,
        parsedTags: Object.keys(tags)
      };
    } catch (parseErr) {
      log('解析失败: ' + parseErr.message);
      results.spawnSync_with_shell = {
        status: r2.status,
        parseError: parseErr.message,
        stdout: r2.stdout ? r2.stdout.substring(0, 500) : null
      };
    }
  } else {
    results.spawnSync_with_shell = { status: r2.status, error: r2.error ? r2.error.message : null, stdout: null };
  }
} catch (e) {
  log('异常: ' + e.message);
  results.spawnSync_with_shell = { status: 'EXCEPTION', error: e.message };
}

// 测试3: 模拟 queryDistTagsSync
log('--- 测试3: 模拟 queryDistTagsSync ---');
try {
  function queryDistTagsSync() {
    const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
    });
    
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('npm exited with status ' + result.status + ': ' + result.stderr);
    
    return JSON.parse(result.stdout);
  }
  
  try {
    const tags = queryDistTagsSync();
    log('成功获取 dist-tags: latest=' + (tags.latest || 'N/A'));
    results.queryDistTagsSync = {
      status: 'SUCCESS',
      tags: Object.keys(tags),
      latest: tags.latest || null
    };
  } catch (e) {
    log('queryDistTagsSync 失败: ' + e.message + ' (code: ' + e.code + ')');
    results.queryDistTagsSync = {
      status: 'FAIL',
      error: e.message,
      errorCode: e.code || null,
      isEINVAL: e.code === 'EINVAL'
    };
  }
} catch (e) {
  log('异常: ' + e.message);
  results.queryDistTagsSync = { status: 'EXCEPTION', error: e.message };
}

// 测试4: 带 shell:true 的 queryDistTagsSync
log('--- 测试4: 带 shell:true 的 queryDistTagsSync ---');
try {
  function queryDistTagsSyncWithShell() {
    const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
      shell: true,
    });
    
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('npm exited with status ' + result.status + ': ' + result.stderr);
    
    return JSON.parse(result.stdout);
  }
  
  try {
    const tags = queryDistTagsSyncWithShell();
    log('成功获取 dist-tags: latest=' + (tags.latest || 'N/A'));
    results.queryDistTagsSync_with_shell = {
      status: 'SUCCESS',
      tags: Object.keys(tags),
      latest: tags.latest || null
    };
  } catch (e) {
    log('失败: ' + e.message);
    results.queryDistTagsSync_with_shell = { status: 'FAIL', error: e.message };
  }
} catch (e) {
  log('异常: ' + e.message);
  results.queryDistTagsSync_with_shell = { status: 'EXCEPTION', error: e.message };
}

// 综合判断
log('--- 综合判断 ---');
const hasEINVAL = (results.spawnSync_no_shell && results.spawnSync_no_shell.hasEINVAL) || (results.queryDistTagsSync && results.queryDistTagsSync.isEINVAL);
const worksWithShell = (results.spawnSync_with_shell && results.spawnSync_with_shell.status === 0) || (results.queryDistTagsSync_with_shell && results.queryDistTagsSync_with_shell.status === 'SUCCESS');

let finalStatus;
let why;

if (hasEINVAL) {
  finalStatus = 'FAIL';
  why = 'Windows 下 spawnSync 调用 npm.cmd 产生 EINVAL 错误，升级检测链不可用（需要 shell:true 修复）';
} else if (worksWithShell) {
  finalStatus = 'PASS';
  why = 'Windows 下检测链可用，spawnSync 工作正常（可能已在 Node 22 中修复）';
} else {
  finalStatus = 'BLOCKED';
  why = '无法确定测试状态，需要进一步检查';
}

log('最终状态: ' + finalStatus);
log('原因: ' + why);

results.D1_39 = {
  status: finalStatus,
  why: why,
  hasEINVAL: hasEINVAL,
  worksWithShell: worksWithShell,
  nodeVersion: process.version,
  platform: process.platform,
  timestamp: new Date().toISOString()
};

// 写入证据文件
const stdoutLog = join(evidenceDir, 'stdout.log');
const logContent = logs.join('\n') + '\n\n=== JSON RESULTS ===\n' + JSON.stringify(results, null, 2);
writeFileSync(stdoutLog, logContent, 'utf8');
log('证据已写入: ' + stdoutLog);

console.log('\n=== FINAL RESULT ===');
console.log(JSON.stringify(results.D1_39, null, 2));
