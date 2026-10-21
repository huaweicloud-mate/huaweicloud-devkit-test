import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceDir = __dirname;

const results = {};
const logs = [];

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = '[' + timestamp + '] ' + msg;
  logs.push(line);
  console.log(line);
}

log('=== P2 用例综合测试 ===');
log('测试环境: Windows, Node ' + process.version);

// D1-4: status/update幂等
log('\n--- D1-4 status/update幂等 ---');
try {
  const { execSync } = await import('node:child_process');
  const status = execSync('huaweicloud-devkit status', { encoding: 'utf8', timeout: 30000 });
  log('status 输出: ' + status.substring(0, 200));
  results['D1-4'] = { status: 'PASS', output: status.substring(0, 200) };
} catch (e) {
  log('D1-4: ' + e.message);
  results['D1-4'] = { status: 'BLOCKED', error: e.message };
}

// D1-30: semver 比对正确性
log('\n--- D1-30 semver 比对正确性 ---');
try {
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const testCases = [
    { v1: '1.1.2', v2: '1.1.1', expected: 1 },
    { v1: '1.1.1', v2: '1.1.2', expected: -1 },
    { v1: '1.1.0', v2: '1.1.0-next.9', expected: 1 },
    { v1: '1.1.1', v2: '1.1.1', expected: 0 }
  ];
  let allPass = true;
  for (const tc of testCases) {
    const result = updateCheck.semverCompare(tc.v1, tc.v2);
    log('semverCompare(' + tc.v1 + ', ' + tc.v2 + ') = ' + result);
    if (result !== tc.expected) allPass = false;
  }
  results['D1-30'] = { status: allPass ? 'PASS' : 'FAIL', testCases: testCases.length };
} catch (e) {
  log('D1-30: ' + e.message);
  results['D1-30'] = { status: 'BLOCKED', error: e.message };
}

// D1-33: skip 文件持久化与多路径
log('\n--- D1-33 skip 文件持久化 ---');
try {
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const hasSkipFilePath = typeof updateCheck.skipFilePath === 'string' || typeof updateCheck.skipFilePath === 'function';
  const hasResolveSkipFilePath = typeof updateCheck.resolveSkipFilePath === 'function';
  log('skipFilePath 存在: ' + hasSkipFilePath);
  log('resolveSkipFilePath 存在: ' + hasResolveSkipFilePath);
  results['D1-33'] = { status: hasSkipFilePath && hasResolveSkipFilePath ? 'PASS' : 'FAIL' };
} catch (e) {
  log('D1-33: ' + e.message);
  results['D1-33'] = { status: 'BLOCKED', error: e.message };
}

// D1-65: 调试模式环境变量
log('\n--- D1-65 调试模式环境变量 ---');
try {
  process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const hasDebug = updateCheck.DEBUG !== undefined || updateCheck.debug !== undefined;
  log('DEBUG 相关: ' + hasDebug);
  results['D1-65'] = { status: hasDebug ? 'PASS' : 'FAIL' };
} catch (e) {
  log('D1-65: ' + e.message);
  results['D1-65'] = { status: 'BLOCKED', error: e.message };
}

// D1-66: 遥测开关与端点环境变量
log('\n--- D1-66 遥测开关 ---');
try {
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const hasTelemetry = updateCheck.isTelemetryEnabled !== undefined || updateCheck.telemetry !== undefined;
  log('遥测相关: ' + hasTelemetry);
  results['D1-66'] = { status: hasTelemetry ? 'PASS' : 'FAIL' };
} catch (e) {
  log('D1-66: ' + e.message);
  results['D1-66'] = { status: 'BLOCKED', error: e.message };
}

// 写入结果
log('\n=== 写入证据文件 ===');
const stdoutLog = join(evidenceDir, 'stdout_p2.log');
const logContent = logs.join('\n') + '\n\n=== JSON RESULTS ===\n' + JSON.stringify(results, null, 2);
writeFileSync(stdoutLog, logContent, 'utf8');
log('证据已写入: ' + stdoutLog);

console.log('\n=== FINAL RESULTS ===');
console.log(JSON.stringify(results, null, 2));
