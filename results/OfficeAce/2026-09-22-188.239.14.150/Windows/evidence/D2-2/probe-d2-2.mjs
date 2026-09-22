// AI生成
/**
 * D2-2: auth status判定准确性
 * 验证: auth_status 在有凭证/无凭证状态下判定准确
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

console.log('=== D2-2: auth status判定准确性 ===');

// Test 1: 有凭证状态下 auth_status
const credPath = 'C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json';
const hasCreds = existsSync(credPath);
console.log(`Real credentials exist: ${hasCreds}`);

const status1 = await callTool('huaweicloud_auth_status', {});
console.log('Status with real creds:', JSON.stringify(status1, null, 2));

check('T1.1 auth_status 返回有效结构', !!status1 && typeof status1 === 'object', 'has response object');
check('T1.2 auth_status 含 credentialsConfigured 字段',
  'credentialsConfigured' in status1,
  `keys: ${Object.keys(status1).join(',')}`);
check('T1.3 有凭证时 credentialsConfigured=true',
  status1.credentialsConfigured === true,
  `credentialsConfigured=${status1.credentialsConfigured}`);

// Test 2: 隔离HOME无凭证状态
const tempHome = mkdtempSync(join(tmpdir(), 'd2-2-'));
const oldHome = process.env.HUAWEICLOUD_HOME;
process.env.HUAWEICLOUD_HOME = tempHome;

// Clear runtime creds
await callTool('huaweicloud_auth_init', { clear: true });

const status2 = await callTool('huaweicloud_auth_status', {});
console.log('Status without creds:', JSON.stringify(status2, null, 2));

check('T2.1 无凭证状态返回有效结构', !!status2 && typeof status2 === 'object', 'has response object');
check('T2.2 无凭证状态标识未就绪',
  status2.credentialsConfigured === false || !status2.credentialsConfigured,
  `credentialsConfigured=${status2.credentialsConfigured}`);

// Test 3: runtime凭证状态
process.env.HUAWEICLOUD_HOME = oldHome || '';
const realCreds = JSON.parse(readFileSync(credPath, 'utf8'));
await callTool('huaweicloud_auth_init', { ak: realCreds.ak, sk: realCreds.sk, region: realCreds.region || 'cn-north-4' });

const status3 = await callTool('huaweicloud_auth_status', {});
console.log('Status with runtime creds:', JSON.stringify(status3, null, 2));

check('T3.1 runtime凭证状态返回有效结构', !!status3 && typeof status3 === 'object', 'has response object');
check('T3.2 runtime凭证状态标识就绪',
  status3.credentialsConfigured === true,
  `credentialsConfigured=${status3.credentialsConfigured}`);

// 清理
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-2', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
