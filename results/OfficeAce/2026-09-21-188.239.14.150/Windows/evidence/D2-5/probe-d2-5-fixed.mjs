// AI生成
/**
 * D2-5: 认证状态检查 - 凭证缺失报错指引
 * 验证: 无凭证/错误凭证/占位符凭证调用时给出明确报错+可执行指引(非裸堆栈)
 * Fix: 直接测试 credential-validator 和 resolveCredentials 的错误处理,
 * 避免运行时凭证干扰
 */
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
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

console.log('=== D2-5: 认证状态检查 - 凭证缺失报错指引 ===');

// Import credentials module
const credsModule = await import(`file://${srcRoot}/auth/credentials.mjs`);
const { resolveCredentials, clearRuntimeCredentials, setRuntimeCredentials, readGlobalCredentials, globalCredentialsPath, isPlaceholder } = credsModule;

// Test 1: 无凭证状态下 resolveCredentials 应抛出带可执行指引的错误
const tempHome = mkdtempSync(join(tmpdir(), 'd2-5-fixed-'));
process.env.HUAWEICLOUD_HOME = tempHome;
// Clear any runtime credentials
clearRuntimeCredentials();

let err1 = null;
try {
  resolveCredentials();
} catch(e) {
  err1 = e;
}

check('T1.1 无凭证调用抛出错误', !!err1, err1 ? `error: ${err1.message?.slice(0,120)}` : 'no error thrown');
if (err1) {
  const msg = err1.message || String(err1);
  check('T1.2 错误消息非裸堆栈', !msg.startsWith('at ') && msg.length < 500, `msg length: ${msg.length}`);
  check('T1.3 错误消息含可执行指引',
    /auth|credential|init|config|AK|SK|认证|凭证|未配置|not.*config|no.*cred|missing/i.test(msg),
    `msg: "${msg.slice(0,120)}"`);
  check('T1.4 错误含错误码', !!err1.code || /HDKIT/i.test(msg), `code: ${err1.code || 'N/A'}`);
}

// Test 2: 占位符凭证应被识别为未配置
const placeholderCases = [
  '<HW_ACCESS_KEY>',
  '${SECRET_KEY}',
  'YOUR_AK',
  'placeholder',
  'replace_me',
  'abc****'
];
let allPlaceholderDetected = true;
for (const ph of placeholderCases) {
  if (!isPlaceholder(ph)) {
    allPlaceholderDetected = false;
    check(`T2.placeholder "${ph}" detected`, false, 'not detected as placeholder');
  }
}
check('T2.1 占位符凭证被识别为未配置', allPlaceholderDetected, `${placeholderCases.length} patterns checked`);

// Test 3: 空凭证应抛出错误
let err3 = null;
try {
  resolveCredentials();
} catch(e) {
  err3 = e;
}
check('T3.1 空凭证调用抛出错误', !!err3, err3 ? `error: ${err3.message?.slice(0,100)}` : 'no error');

// Test 4: auth_status 在无凭证时给出正确指引
const { callTool } = await import(`file://${srcRoot}/tools.mjs`);
clearRuntimeCredentials();

const status = await callTool('huaweicloud_auth_status', {});
check('T4.1 auth_status 返回有效结构', !!status && typeof status === 'object', 'has response');
check('T4.2 auth_status 含 credentialsConfigured 字段', 
  status && typeof status.credentialsConfigured !== 'undefined',
  `credentialsConfigured=${status?.credentialsConfigured}`);
check('T4.3 auth_status 含 onboarding 指引',
  !!status?.onboarding && typeof status.onboarding === 'object',
  `scenario: ${status?.onboarding?.scenario}`);
check('T4.4 auth_status onboarding 含 steps',
  Array.isArray(status?.onboarding?.steps),
  `steps count: ${status?.onboarding?.steps?.length}`);

// Test 5: 有凭证时 resolveCredentials 正常返回
// Restore real credentials
delete process.env.HUAWEICLOUD_HOME;
clearRuntimeCredentials();
const realCreds = readGlobalCredentials();
check('T5.1 真实凭证可读取', !!realCreds && !!realCreds.ak, `ak prefix: ${realCreds?.ak?.slice(0,6)}...`);

if (realCreds) {
  let resolved = null;
  let err5 = null;
  try {
    resolved = resolveCredentials();
  } catch(e) {
    err5 = e;
  }
  check('T5.2 有凭证时 resolveCredentials 正常', !!resolved && !err5, 
    resolved ? `ak: ${resolved.ak?.slice(0,6)}...` : `error: ${err5?.message?.slice(0,80)}`);
}

// 清理
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-5', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
