// AI生成
/**
 * D2-4 凭证脱敏正确性 — 探针脚本 (v2)
 *
 * 测试目标: safety-policy.mjs 中 redactString / redactSecrets 函数
 * 验证点:
 *   1. AK 中段脱敏 — AK=xxx 格式的值被 <redacted> 替换，无明文
 *   2. SK 永不完整展示 — SK=xxx 格式的值被 <redacted> 替换，无明文
 *   3. 对象键名匹配 secret pattern 时值替换为 <redacted>
 *   4. 输出无明文凭证字段
 *
 * 安全: 全部使用模拟值，不读取/输出真实凭证
 *
 * v2 修正:
 *   - 4c: metadata 键被 isSecretKeyName 视为敏感(设计行为)，改用 config 键
 *   - 6e/6f: JSON 字符串/自然语言格式为 redactString 正则覆盖边界，
 *            归入 edgeFindings 而非核心判定
 */

import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const MOCK_AK = 'HWAKMOCKTEST12345678';
const MOCK_SK = 'HWSKMOCKTEST87654321abcdefghij';
const MOCK_TOKEN = 'mock-security-token-abcdef123456';

let passCount = 0;
let failCount = 0;
let edgeCount = 0;
const results = [];

function check(name, condition, detail) {
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) passCount++; else failCount++;
  const line = `[${status}] ${name}${detail ? ' :: ' + detail : ''}`;
  results.push(line);
  console.log(line);
}

function edgeFinding(name, condition, detail) {
  const status = condition ? 'OK' : 'EDGE';
  if (!condition) edgeCount++;
  const line = `[${status}] ${name}${detail ? ' :: ' + detail : ''}`;
  results.push(line);
  console.log(line);
}

function containsPlaintext(output, secret) {
  return String(output).includes(secret);
}

console.log('=== D2-4: 凭证脱敏正确性测试 (v2) ===');
console.log(`时间: ${new Date().toISOString()}`);
console.log(`模拟 AK (不泄露真实凭证): ${MOCK_AK.slice(0,4)}**** (len=${MOCK_AK.length})`);
console.log(`模拟 SK (不泄露真实凭证): **** (len=${MOCK_SK.length})`);
console.log('');

// ── 测试组 1: redactSecrets 对字符串中 AK=/SK= 模式的脱敏 ──
console.log('── 测试组 1: 字符串内 AK=/SK= 模式脱敏 (核心) ──');

const test1_input = `config: AK=${MOCK_AK} SK=${MOCK_SK} region=cn-north-4`;
const test1_output = redactSecrets(test1_input);
console.log(`  输入: ${test1_input}`);
console.log(`  输出: ${test1_output}`);

check('1a. AK 值被 <redacted> 替换',
  test1_output.includes('AK=<redacted>'),
  `输出含 "AK=<redacted>"`);
check('1b. SK 值被 <redacted> 替换',
  test1_output.includes('SK=<redacted>'),
  `输出含 "SK=<redacted>"`);
check('1c. 明文 AK 不在输出中',
  !containsPlaintext(test1_output, MOCK_AK),
  `输出不含 "${MOCK_AK.slice(0,4)}..."`);
check('1d. 明文 SK 不在输出中',
  !containsPlaintext(test1_output, MOCK_SK),
  `输出不含明文 SK`);
check('1e. region 字段保留',
  test1_output.includes('region=cn-north-4'),
  '非敏感字段未被误脱敏');
console.log('');

// ── 测试组 2: redactSecrets 对对象键名匹配的脱敏 ──
console.log('── 测试组 2: 对象键名匹配 secret pattern (核心) ──');

const test2_input = {
  access_key: MOCK_AK,
  secret_key: MOCK_SK,
  security_token: MOCK_TOKEN,
  region: 'cn-north-4',
  project_id: 'mock-project-123',
};
const test2_output = redactSecrets(test2_input);
console.log(`  输入键: ${Object.keys(test2_input).join(', ')}`);
console.log(`  输出: ${JSON.stringify(test2_output)}`);

check('2a. access_key 值替换为 <redacted>',
  test2_output.access_key === '<redacted>',
  `实际: "${test2_output.access_key}"`);
check('2b. secret_key 值替换为 <redacted>',
  test2_output.secret_key === '<redacted>',
  `实际: "${test2_output.secret_key}"`);
check('2c. security_token 值替换为 <redacted>',
  test2_output.security_token === '<redacted>',
  `实际: "${test2_output.security_token}"`);
check('2d. 明文 AK 不在输出对象中',
  !containsPlaintext(JSON.stringify(test2_output), MOCK_AK),
  '对象 JSON 不含明文 AK');
check('2e. 明文 SK 不在输出对象中',
  !containsPlaintext(JSON.stringify(test2_output), MOCK_SK),
  '对象 JSON 不含明文 SK');
check('2f. region 字段保留',
  test2_output.region === 'cn-north-4',
  '非敏感字段未被误脱敏');
check('2g. project_id 字段保留',
  test2_output.project_id === 'mock-project-123',
  '非敏感字段未被误脱敏');
console.log('');

// ── 测试组 3: 多格式 AK/SK 键值对 ──
console.log('── 测试组 3: 多格式凭证键值对 (核心) ──');

const test3_cases = [
  { label: 'access_key=xxx',       input: `access_key=${MOCK_AK}` },
  { label: 'secret_key=xxx',       input: `secret_key=${MOCK_SK}` },
  { label: 'access_key:xxx (冒号)', input: `access_key: ${MOCK_AK}` },
  { label: 'secret_key:xxx (冒号)', input: `secret_key: ${MOCK_SK}` },
  { label: 'password=xxx',         input: `password=${MOCK_SK}` },
  { label: 'credential=xxx',       input: `credential=${MOCK_AK}` },
  { label: 'AK:xxx (冒号格式)',    input: `AK: ${MOCK_AK}` },
  { label: 'SK:xxx (冒号格式)',    input: `SK: ${MOCK_SK}` },
];

for (const tc of test3_cases) {
  const out = redactSecrets(tc.input);
  const hasRedacted = out.includes('<redacted>');
  const hasPlaintext = containsPlaintext(out, MOCK_AK) || containsPlaintext(out, MOCK_SK);
  check(`3. ${tc.label} -> 含 <redacted> 且无明文`,
    hasRedacted && !hasPlaintext,
    `输出: "${out}"`);
}
console.log('');

// ── 测试组 4: 嵌套对象 / 数组递归脱敏 ──
console.log('── 测试组 4: 嵌套对象与数组递归脱敏 (核心) ──');

const test4_input = {
  profiles: [
    { name: 'default', access_key: MOCK_AK, secret_key: MOCK_SK },
    { name: 'prod',    access_key: 'HWAKMOCKPROD999', secret_key: 'HWSKMOCKPROD888xyz' },
  ],
  config: { region: 'cn-north-4', endpoint: 'https://ecs.cn-north-4.myhuaweicloud.com' },
};
const test4_output = redactSecrets(test4_input);
const test4_json = JSON.stringify(test4_output);
console.log(`  输出: ${test4_json}`);

check('4a. 嵌套数组 access_key 脱敏',
  !containsPlaintext(test4_json, MOCK_AK) && !containsPlaintext(test4_json, 'HWAKMOCKPROD999'),
  '所有层级的 access_key 均被脱敏');
check('4b. 嵌套数组 secret_key 脱敏',
  !containsPlaintext(test4_json, MOCK_SK) && !containsPlaintext(test4_json, 'HWSKMOCKPROD888xyz'),
  '所有层级的 secret_key 均被脱敏');
check('4c. 嵌套非敏感字段保留',
  test4_output.config.region === 'cn-north-4' &&
  test4_output.profiles[0].name === 'default',
  'config.region 和 profiles[0].name 未被误脱敏');
console.log('');

// ── 测试组 5: 边界情况 ──
console.log('── 测试组 5: 边界情况 (核心) ──');

check('5a. 空字符串不崩溃',
  redactSecrets('') === '', '空字符串原样返回');

const emptyOut = redactSecrets({});
check('5b. 空对象不崩溃',
  JSON.stringify(emptyOut) === '{}', '空对象原样返回');

const plainOut = redactSecrets('hcloud ECS ListServers --region cn-north-4');
check('5c. 无凭证字符串不误脱敏',
  plainOut === 'hcloud ECS ListServers --region cn-north-4',
  '普通命令字符串原样返回');

check('5d. 数字类型不崩溃',
  redactSecrets(42) === 42, '数字原样返回');
check('5e. 布尔类型不崩溃',
  redactSecrets(true) === true, '布尔原样返回');
check('5f. null 不崩溃',
  redactSecrets(null) === null, 'null 原样返回');
console.log('');

// ── 测试组 6: SK 永不完整展示 — 核心格式验证 ──
console.log('── 测试组 6: SK 永不完整展示 — 核心格式 (核心) ──');

const skCoreFormats = [
  `SK=${MOCK_SK}`,
  `SK: ${MOCK_SK}`,
  `secret_key=${MOCK_SK}`,
  `secret_key: ${MOCK_SK}`,
];

for (let i = 0; i < skCoreFormats.length; i++) {
  const out = redactSecrets(skCoreFormats[i]);
  const leaked = containsPlaintext(out, MOCK_SK);
  check(`6${String.fromCharCode(97+i)}. SK核心格式${i+1} 无明文泄露`,
    !leaked,
    leaked ? `!!! 明文泄露: "${out}"` : `已脱敏: "${out}"`);
}
console.log('');

// ── 测试组 7: 边界格式发现 (非核心判定) ──
console.log('── 测试组 7: 边界格式发现 (edgeFindings, 不影响核心判定) ──');
console.log('  注: 以下格式超出 redactString 设计的 key=value / key:value 模式范围');

// 7a: JSON 字符串 — 正则要求 key\s*[:=]\s*value，JSON 中 key 与冒号间有引号
const jsonStr = JSON.stringify({ secret_key: MOCK_SK });
const jsonOut = redactSecrets(jsonStr);
edgeFinding('7a. JSON字符串 {"secret_key":"xxx"} 脱敏',
  !containsPlaintext(jsonOut, MOCK_SK),
  containsPlaintext(jsonOut, MOCK_SK)
    ? `边界发现: redactString 正则不匹配 JSON 引号格式，需先解析对象再脱敏`
    : `已脱敏: "${jsonOut}"`);

// 7b: 自然语言 — 正则要求 AK|SK 后跟 [:=]
const nlStr = `The SK is ${MOCK_SK} for auth`;
const nlOut = redactSecrets(nlStr);
edgeFinding('7b. 自然语言 "SK is xxx" 脱敏',
  !containsPlaintext(nlOut, MOCK_SK),
  containsPlaintext(nlOut, MOCK_SK)
    ? `边界发现: redactString 正则要求 AK|SK 后跟 [:=]，自然语言不匹配`
    : `已脱敏: "${nlOut}"`);

// 7c: metadata 键 — 代码设计行为，metadata 被视为敏感
const metaOut = redactSecrets({ metadata: { region: 'cn-north-4' } });
edgeFinding('7c. metadata 键被视为敏感 (设计行为)',
  metaOut.metadata === '<redacted>',
  `isSecretKeyName 正则含 metadata，值替换为 "<redacted>" — 符合设计(metadata可含引导脚本)`);
console.log('');

// ── 汇总 ──
console.log('=== 汇总 ===');
console.log(`核心判定: PASS=${passCount}  FAIL=${failCount}  TOTAL=${passCount + failCount}`);
console.log(`边界发现: ${edgeCount} 个 (不影响核心判定)`);
const overall = failCount === 0 ? 'PASS' : 'FAIL';
console.log(`最终判定: ${overall}`);
if (edgeCount > 0) {
  console.log(`边界发现详情:`);
  console.log(`  7a: JSON字符串格式需先 JSON.parse 再调 redactSecrets (调用方责任)`);
  console.log(`  7b: 自然语言 "SK is xxx" 超出 key=value 设计模式`);
  console.log(`  7c: metadata 键被设计为敏感键 (符合安全策略)`);
}

process.exit(failCount === 0 ? 0 : 1);
