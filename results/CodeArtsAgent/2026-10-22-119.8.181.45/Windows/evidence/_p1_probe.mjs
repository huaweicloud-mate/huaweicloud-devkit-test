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

log('=== P1 用例综合测试 ===');
log('测试环境: Windows, Node ' + process.version);

// D1-26: 升级提醒工具注册
log('\n--- D1-26 升级提醒工具注册 ---');
try {
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const hasJudgeUpdate = typeof updateCheck.judgeUpdate === 'function';
  const hasSemverCompare = typeof updateCheck.semverCompare === 'function';
  log('judgeUpdate 存在: ' + hasJudgeUpdate);
  log('semverCompare 存在: ' + hasSemverCompare);
  results['D1-26'] = { status: hasJudgeUpdate && hasSemverCompare ? 'PASS' : 'FAIL', hasJudgeUpdate, hasSemverCompare };
} catch (e) {
  log('D1-26 失败: ' + e.message);
  results['D1-26'] = { status: 'BLOCKED', error: e.message };
}

// D1-27: 检测语义-已是最新
log('\n--- D1-27 检测语义-已是最新 ---');
try {
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const result = updateCheck.judgeUpdate('1.1.2', { latest: '1.1.2', next: null });
  log('judgeUpdate(1.1.2, {latest:1.1.2}) = ' + result.result);
  results['D1-27'] = { status: result.result === 'up_to_date' ? 'PASS' : 'FAIL', result: result.result };
} catch (e) {
  log('D1-27 失败: ' + e.message);
  results['D1-27'] = { status: 'BLOCKED', error: e.message };
}

// D1-28: 检测语义-有新版本
log('\n--- D1-28 检测语义-有新版本 ---');
try {
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const result = updateCheck.judgeUpdate('1.1.1', { latest: '1.1.2', next: null });
  log('judgeUpdate(1.1.1, {latest:1.1.2}) = ' + result.result);
  results['D1-28'] = { status: result.result === 'update_available' && result.targetVersion === '1.1.2' ? 'PASS' : 'FAIL', result: result.result, targetVersion: result.targetVersion };
} catch (e) {
  log('D1-28 失败: ' + e.message);
  results['D1-28'] = { status: 'BLOCKED', error: e.message };
}

// D1-31: dismiss 冷却期
log('\n--- D1-31 dismiss 冷却期 ---');
try {
  const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const result = updateCheck.judgeUpdate('1.1.1', { latest: '1.1.2', next: null }, true);
  log('judgeUpdate with dismiss=true = ' + result.result);
  results['D1-31'] = { status: result.result === 'dismissed' ? 'PASS' : 'FAIL', result: result.result };
} catch (e) {
  log('D1-31 失败: ' + e.message);
  results['D1-31'] = { status: 'BLOCKED', error: e.message };
}

// 写入结果
log('\n=== 写入证据文件 ===');
const stdoutLog = join(evidenceDir, 'stdout.log');
const logContent = logs.join('\n') + '\n\n=== JSON RESULTS ===\n' + JSON.stringify(results, null, 2);
writeFileSync(stdoutLog, logContent, 'utf8');
log('证据已写入: ' + stdoutLog);

console.log('\n=== FINAL RESULTS ===');
console.log(JSON.stringify(results, null, 2));
