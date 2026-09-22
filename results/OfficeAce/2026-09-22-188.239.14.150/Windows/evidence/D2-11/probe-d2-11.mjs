// AI生成
/**
 * D2-11 Probe: R3 STS token拒绝落盘
 *
 * 验证点:
 *   1. auth_switch persist + securityToken → 返回 {status:'error', scope:'rejected'}
 *   2. S1 (credentials.json) 未写入 token
 *   3. 即使 S1 已存在，token 也不会被追加/覆盖到其中
 *
 * 安全措施:
 *   - 使用模拟 STS token 值，不涉及真实凭证
 *   - HUAWEICLOUD_HOME 指向临时目录，隔离真实 S1
 */

import { existsSync, readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ── 隔离环境 ──────────────────────────────────────────────
const tempHome = mkdtempSync(join(tmpdir(), 'd2-11-'));
process.env.HUAWEICLOUD_HOME = tempHome;

// ── 加载被测模块 ──────────────────────────────────────────
const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const { callTool } = await import(`file://${srcRoot}/tools.mjs`);
const { globalCredentialsPath, readGlobalCredentials } = await import(`file://${srcRoot}/auth/credentials.mjs`);

// ── 模拟 STS 凭证 (非真实值) ──────────────────────────────
const MOCK_AK = 'MOCKAKD2ELEVEN0001';
const MOCK_SK = 'MOCKSKd2elevenscret0001ForTestOnly';
const MOCK_STS_TOKEN = 'MOCK_STS_TOKEN_D2_11_' + 'x'.repeat(40); // 模拟临时 token
const MOCK_REGION = 'cn-north-4';

const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (detail) console.log(`       ${detail}`);
}

// ── Test 1: persist + securityToken → rejected ───────────
console.log('\n=== Test 1: auth_switch persist + securityToken ===');
const s1Path = globalCredentialsPath();
console.log(`S1 path: ${s1Path}`);
console.log(`S1 exists before: ${existsSync(s1Path)}`);

const resp1 = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: MOCK_AK,
  sk: MOCK_SK,
  securityToken: MOCK_STS_TOKEN,
  region: MOCK_REGION,
});

console.log('Response:', JSON.stringify(resp1, null, 2));

check(
  'T1.1 返回 status=error',
  resp1.status === 'error',
  `actual status=${resp1.status}`,
);
check(
  'T1.2 返回 scope=rejected',
  resp1.scope === 'rejected',
  `actual scope=${resp1.scope}`,
);
check(
  'T1.3 错误消息包含 R3',
  String(resp1.error || '').includes('R3'),
  `error="${resp1.error}"`,
);

// ── Test 2: S1 未写入 token ───────────────────────────────
console.log('\n=== Test 2: S1 未写入 token ===');
console.log(`S1 exists after: ${existsSync(s1Path)}`);

if (existsSync(s1Path)) {
  const s1Content = readFileSync(s1Path, 'utf8');
  console.log(`S1 content: ${s1Content}`);
  check(
    'T2.1 S1 中不含模拟 STS token',
    !s1Content.includes(MOCK_STS_TOKEN),
    'token 不应出现在 S1 文件中',
  );
  const s1Json = JSON.parse(s1Content);
  check(
    'T2.2 S1 securityToken 字段为空',
    String(s1Json.securityToken || '') === '',
    `securityToken="${s1Json.securityToken}"`,
  );
} else {
  check('T2.1 S1 文件未创建 (token 未落盘)', true, 'S1 不存在 → token 确实未落盘');
  check('T2.2 S1 securityToken 字段为空 (文件不存在)', true, 'N/A');
}

// ── Test 3: 预存在 S1 (同账号) + token → 仍 rejected ─────
// 使用相同 AK 避免触发 conflict 分支，直接到达 persistCredentials 的 R3 检查
console.log('\n=== Test 3: 预存在 S1 (同账号) + token → 仍 rejected ===');
const { writeGlobalCredentials } = await import(`file://${srcRoot}/auth/credentials.mjs`);
writeGlobalCredentials({
  ak: MOCK_AK,
  sk: MOCK_SK,
  securityToken: '',
  region: MOCK_REGION,
});
console.log(`Pre-existing S1 written (same AK=${MOCK_AK}, no token)`);

// 再次尝试 persist + token (同 AK → 不触发 conflict → 到达 persistCredentials)
const resp3 = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: MOCK_AK,
  sk: MOCK_SK,
  securityToken: MOCK_STS_TOKEN,
  region: MOCK_REGION,
});

console.log('Response:', JSON.stringify(resp3, null, 2));

check(
  'T3.1 预存在 S1 (同账号) + token 仍返回 rejected',
  resp3.status === 'error' && resp3.scope === 'rejected',
  `status=${resp3.status}, scope=${resp3.scope}`,
);

// 验证 S1 未被修改为含 token 的版本
const s1After = readGlobalCredentials();
console.log(`S1 after attempt: ${JSON.stringify(s1After)}`);
check(
  'T3.2 S1 中仍不含模拟 STS token',
  !JSON.stringify(s1After).includes(MOCK_STS_TOKEN),
  'token 不应出现在 S1 中',
);
check(
  'T3.3 S1 securityToken 仍为空',
  String(s1After?.securityToken || '') === '',
  `securityToken="${s1After?.securityToken}"`,
);

// ── Test 4: persist 不带 token → 正常落盘 (对照组) ────────
console.log('\n=== Test 4: persist 不带 token (对照组) ===');
// S1 已含同 AK，不触发 conflict
const resp4 = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: MOCK_AK,
  sk: MOCK_SK,
  // securityToken 故意省略
  region: MOCK_REGION,
});

console.log('Response:', JSON.stringify(resp4, null, 2));

check(
  'T4.1 无 token 时 persist 不被 rejected',
  resp4.status !== 'error' || resp4.scope !== 'rejected',
  `status=${resp4.status}, scope=${resp4.scope}`,
);

// 确认 S1 被写入但 securityToken 为空
const s1Control = readGlobalCredentials();
check(
  'T4.2 对照组 S1 securityToken 为空字符串',
  String(s1Control?.securityToken || '') === '',
  `securityToken="${s1Control?.securityToken}"`,
);

// ── Test 5: 源码静态验证 ─────────────────────────────────
console.log('\n=== Test 5: 源码静态验证 ===');
const toolsSource = readFileSync(join(srcRoot, 'tools.mjs'), 'utf8');

// 验证 persistCredentials 函数中存在 STS 拒绝逻辑
check(
  'T5.1 源码含 STS 拒绝逻辑 (R3)',
  toolsSource.includes('Temporary STS credentials cannot be persisted (R3)'),
  'persistCredentials 中存在 R3 拒绝分支',
);

// 验证拒绝时返回 scope: 'rejected'
check(
  'T5.2 源码含 scope: rejected',
  toolsSource.includes("scope: 'rejected'"),
  '拒绝分支返回 scope=rejected',
);

// 验证 writeGlobalCredentials 调用时 securityToken 显式置空
check(
  'T5.3 持久化时 securityToken 显式置空',
  toolsSource.includes("securityToken: ''"),
  'writeGlobalCredentials 调用中 securityToken 被设为空字符串',
);

// ── 清理 ──────────────────────────────────────────────────
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

// ── 汇总 ──────────────────────────────────────────────────
console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

// 输出结构化结果
console.log('\n=== RESULT ===');
console.log(JSON.stringify({
  testCase: 'D2-11',
  title: 'R3 STS token拒绝落盘',
  result: overallPass ? 'PASS' : 'FAIL',
  checks: results,
  timestamp: new Date().toISOString(),
}));
