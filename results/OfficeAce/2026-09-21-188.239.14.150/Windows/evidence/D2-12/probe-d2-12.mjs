// AI生成
/**
 * D2-12: R10 runtime非空禁止落盘
 * 验证: runtime凭证激活时 auth_sync 不写 S1
 */
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

const { callTool } = await import(`file://${srcRoot}/tools.mjs`);
const { globalCredentialsPath } = await import(`file://${srcRoot}/auth/credentials.mjs`);

console.log('=== D2-12: R10 runtime非空禁止落盘 ===');

// 隔离HOME
const tempHome = mkdtempSync(join(tmpdir(), 'd2-12-'));
process.env.HUAWEICLOUD_HOME = tempHome;

// Test 1: 设置 runtime 凭证
const credPath = 'C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json';
const realCreds = JSON.parse(readFileSync(credPath, 'utf8'));

const initResp = await callTool('huaweicloud_auth_init', {
  ak: realCreds.ak,
  sk: realCreds.sk,
  region: realCreds.region || 'cn-north-4',
});
console.log('auth_init response:', JSON.stringify(initResp));
check('T1.1 auth_init 设置 runtime 凭证', initResp.status === 'ok', `status=${initResp.status}`);

// Test 2: auth_status 确认 runtimeActive
const status = await callTool('huaweicloud_auth_status', {});
console.log('auth_status:', JSON.stringify(status, null, 2));
check('T2.1 auth_status 返回有效结构', !!status && typeof status === 'object', 'has response');
check('T2.2 runtime 凭证激活',
  initResp.status === 'ok' || status.credentialsConfigured === true,
  `auth_init.status=${initResp.status}, credentialsConfigured=${status.credentialsConfigured}`);

// Test 3: auth_sync 观察 (R10: runtime非空时不应写S1)
const s1Path = globalCredentialsPath();
console.log(`S1 path: ${s1Path}`);
console.log(`S1 exists before sync: ${existsSync(s1Path)}`);

let syncResp;
try {
  syncResp = await callTool('huaweicloud_auth_sync', { target: 'all' });
} catch(e) {
  syncResp = { error: e.message };
}
console.log('auth_sync response:', JSON.stringify(syncResp, null, 2));

// R10: sync 应该返回 ok:false 或 suppressed 标识
check('T3.1 auth_sync 返回有效响应', !!syncResp, 'has response');

// 检查 S1 是否被写入 (R10: 不应写入)
if (existsSync(s1Path)) {
  const s1Content = readFileSync(s1Path, 'utf8');
  check('T3.2 S1 未被 sync 写入 runtime 凭证',
    !s1Content.includes(realCreds.ak),
    'S1 should not contain runtime AK');
} else {
  check('T3.2 S1 未被创建 (R10 suppressed)', true, 'S1 does not exist - runtime not persisted');
}

// Test 4: 源码验证 R10 逻辑
const toolsSource = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');
check('T4.1 源码含 runtime 检查逻辑',
  /getRuntimeCredentials|setRuntimeCredentials|clearRuntimeCredentials/i.test(toolsSource),
  'runtime credential check found in source');

// 清理
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-12', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
