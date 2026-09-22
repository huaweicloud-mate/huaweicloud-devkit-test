// AI生成
/**
 * D2-27: KooCLI版本管理
 * 验证: getKooCliVersion/parseHcloudVersion/compareVersion/kooCliDownloadBase
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== D2-27: KooCLI版本管理 ===');

// 加载 koocli-version 模块
const koocliPath = join(srcRoot, 'koocli-version.mjs');
check('T0.1 koocli-version.mjs 存在', existsSync(koocliPath), `path: ${koocliPath}`);

const mod = await import(`file://${koocliPath}`);
const { getKooCliVersion, parseHcloudVersion, compareVersion, kooCliDownloadBase, KOO_CLI_BASE } = mod;

// Test 1: getKooCliVersion
let version;
try {
  version = getKooCliVersion();
} catch(e) {
  version = null;
}
console.log(`getKooCliVersion(): ${version}`);
check('T1.1 getKooCliVersion 返回版本串', !!version && typeof version === 'string', `version=${version}`);
check('T1.2 版本格式 x.y.z', /^\d+\.\d+\.\d+/.test(version || ''), `format check: ${version}`);

// Test 2: parseHcloudVersion
const parseTests = [
  { input: 'hcloud 7.2.12', expected: '7.2.12' },
  { input: 'hcloud 7.2.12 (latest)', expected: '7.2.12' },
  { input: 'HuaweiCloud CLI: 7.2.12', expected: '7.2.12' },
  { input: 'hcloud 7.2.9', expected: '7.2.9' },
];

for (const tc of parseTests) {
  let parsed;
  try {
    parsed = parseHcloudVersion(tc.input);
  } catch(e) {
    parsed = null;
  }
  check(`T2. parseHcloudVersion("${tc.input}") = "${tc.expected}"`,
    parsed === tc.expected,
    `actual="${parsed}"`);
}

// Test 3: compareVersion
const compareTests = [
  { a: '7.2.12', b: '7.2.9', expected: 1, desc: '7.2.12 > 7.2.9' },
  { a: '7.2.9', b: '7.2.12', expected: -1, desc: '7.2.9 < 7.2.12' },
  { a: '7.2.12', b: '7.2.12', expected: 0, desc: '7.2.12 == 7.2.12' },
  { a: '8.0.0', b: '7.2.12', expected: 1, desc: '8.0.0 > 7.2.12' },
];

for (const tc of compareTests) {
  let result;
  try {
    result = compareVersion(tc.a, tc.b);
  } catch(e) {
    result = null;
  }
  const normalized = result > 0 ? 1 : result < 0 ? -1 : 0;
  check(`T3. compareVersion(${tc.desc})`,
    normalized === tc.expected,
    `actual=${result}, expected sign=${tc.expected}`);
}

// Test 4: kooCliDownloadBase
let baseUrl;
try {
  baseUrl = kooCliDownloadBase();
} catch(e) {
  baseUrl = null;
}
console.log(`kooCliDownloadBase(): ${baseUrl}`);
check('T4.1 kooCliDownloadBase 返回 URL', !!baseUrl && typeof baseUrl === 'string', `base=${baseUrl}`);
check('T4.2 URL 含 KOO_CLI_BASE 或 http', 
  /http|KOO_CLI_BASE/i.test(baseUrl || ''),
  `base contains URL pattern`);

// Test 5: KOO_CLI_BASE 常量
check('T5.1 KOO_CLI_BASE 常量存在', !!KOO_CLI_BASE, `KOO_CLI_BASE=${KOO_CLI_BASE}`);

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D2-27', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
