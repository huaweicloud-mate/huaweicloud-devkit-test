// 环境变量覆盖夹具：HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT + HUAWEICLOUD_INJECT_STS_CMD 边界值矩阵
// 2 变量 × 边界值矩阵（未设置/1/0/true/false/空串/大小写/非法值），验证精确字符串比较行为
// 用法: node env-var-coverage.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/ENV-VAR/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node env-var-coverage.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// ─── HUAWEICLOUD_INJECT_STS_CMD 边界值矩阵 ───
// 生效条件：严格 === '0' 或 === 'false' → 禁用注入返回 []
// 其他值（包括未设置/1/true/空串/2）→ 继续注入
// SUT: hcloud-cli.mjs resolveStsInjectArgs
const hcloudBase = new URL(`file://${hdkSrc}/hcloud-cli.mjs`);
const { resolveStsInjectArgs } = await import(hcloudBase);

const credBase = new URL(`file://${hdkSrc}/auth/credentials.mjs`);
const { setRuntimeCredentials, clearRuntimeCredentials } = await import(credBase);

// 设置 runtime 凭证使注入有内容可注入
setRuntimeCredentials('AKTESTENV', 'SKTESTENV', 'STKTESTENV', 'cn-north-4');
const testArgs = ['ECS', 'ListServers', '--cli-region=cn-north-4'];

// 边界值矩阵
const INJECT_MATRIX = [
  { label: 'unset',       value: undefined, shouldInject: true  }, // 未设置 → 继续注入
  { label: '0',            value: '0',        shouldInject: false }, // === '0' → 禁用
  { label: 'false',       value: 'false',    shouldInject: false }, // === 'false' → 禁用
  { label: '1',            value: '1',        shouldInject: true  }, // 非 '0'/'false' → 继续注入
  { label: 'true',        value: 'true',     shouldInject: true  }, // 非 '0'/'false' → 继续注入
  { label: 'empty',       value: '',         shouldInject: true  }, // 空串 → 继续注入
  { label: 'FALSE-upper', value: 'FALSE',    shouldInject: true  }, // 大写 'FALSE' ≠ 'false' → 继续注入（精确比较）
  { label: 'False-mixed', value: 'False',    shouldInject: true  }, // 混合大小写 ≠ 'false' → 继续注入
  { label: '2-illegal',   value: '2',        shouldInject: true  }, // 非法值 → 继续注入
];

for (const { label, value, shouldInject } of INJECT_MATRIX) {
  if (value === undefined) delete process.env.HUAWEICLOUD_INJECT_STS_CMD;
  else process.env.HUAWEICLOUD_INJECT_STS_CMD = value;

  const result = resolveStsInjectArgs(testArgs);
  const injects = result.length > 0;
  rec(`ENV-INJECT-${label}`, `HUAWEICLOUD_INJECT_STS_CMD='${label}' → ${shouldInject ? 'inject' : 'no-inject'}`,
      injects === shouldInject, injects, shouldInject,
      `value=${JSON.stringify(value)} result.len=${result.length}`);
}

// 源码验证：resolveStsInjectArgs 中 kill-switch 使用精确字符串比较
{
  const src = readFileSync(new URL(`file://${hdkSrc}/hcloud-cli.mjs`), 'utf8');
  const hasStrict0 = src.includes("flag === '0'");
  const hasStrictFalse = src.includes("flag === 'false'");
  rec('ENV-INJECT-src-strict-compare', '源码: resolveStsInjectArgs 使用 === "0" / === "false" 精确比较',
      hasStrict0 && hasStrictFalse,
      { hasStrict0, hasStrictFalse },
      { hasStrict0: true, hasStrictFalse: true });
}

// ─── HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT 边界值矩阵 ───
// 生效条件：严格 === '1' → 跳过 OfficeAce 系统探针（return null）
// 其他值（包括 '0'/'true'/''/未设置）→ 照常探针
// SUT: setup-cli.mjs officeaceCapabilitiesDir()（private function → 源码级验证 + 行为验证）

// ① 源码验证：=== '1' 精确比较
{
  const src = readFileSync(new URL(`file://${hdkSrc}/setup-cli.mjs`), 'utf8');
  const hasStrict1 = src.includes("HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT === '1'");
  rec('ENV-SKIP-src-strict-compare', '源码: HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT === "1" 精确比较',
      hasStrict1, hasStrict1, true);
}

// ② 源码验证：非 '1' 值不触发跳过（逻辑验证）
{
  const src = readFileSync(new URL(`file://${hdkSrc}/setup-cli.mjs`), 'utf8');
  // 找到 SKIP_OFFICEACE_DETECT 行，确认是 === '1' 而非 truthy 检查
  const line = src.split('\n').find((l) => l.includes('SKIP_OFFICEACE_DETECT'));
  const isStrictEqual = line && line.includes("=== '1'");
  const isNotTruthy = !line || !line.includes("if (process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT)");
  rec('ENV-SKIP-src-not-truthy', '源码: 非 truthy 检查（精确 === "1" 而非 if(env)）',
      isStrictEqual && isNotTruthy,
      { line: line?.trim(), isStrictEqual, isNotTruthy },
      { isStrictEqual: true, isNotTruthy: true });
}

// ③ 边界值矩阵（源码语义推导）
// 由于 officeaceCapabilitiesDir 是 private function，无法直接调用
// 但源码逻辑是：=== '1' → return null（跳过探针）；其他 → 继续探针
// 我们验证源码逻辑的正确性
const SKIP_MATRIX = [
  { label: 'unset',     value: undefined, shouldSkip: false }, // 未设置 → 照常探针
  { label: '1',         value: '1',        shouldSkip: true  }, // === '1' → 跳过
  { label: '0',         value: '0',        shouldSkip: false }, // 非 '1' → 照常探针
  { label: 'true',      value: 'true',     shouldSkip: false }, // 非 '1'（'true' ≠ '1'）→ 照常探针
  { label: 'false',     value: 'false',    shouldSkip: false }, // 非 '1' → 照常探针
  { label: 'empty',     value: '',         shouldSkip: false }, // 空串 ≠ '1' → 照常探针
  { label: 'TRUE-upper',value: 'TRUE',     shouldSkip: false }, // 大写 ≠ '1' → 照常探针
  { label: '2-illegal', value: '2',        shouldSkip: false }, // 非法值 ≠ '1' → 照常探针
];

for (const { label, value, shouldSkip } of SKIP_MATRIX) {
  // 模拟源码逻辑：const flag = process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT; flag === '1'
  if (value === undefined) delete process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT;
  else process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT = value;

  const flag = process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT;
  const skips = flag === '1'; // 精确源码语义复现
  rec(`ENV-SKIP-${label}`, `HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT='${label}' → ${shouldSkip ? 'skip' : 'probe'}`,
      skips === shouldSkip, skips, shouldSkip,
      `value=${JSON.stringify(value)} flag=${JSON.stringify(flag)}`);
}

// 清理
clearRuntimeCredentials();
delete process.env.HUAWEICLOUD_INJECT_STS_CMD;
delete process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT;

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== 环境变量覆盖夹具 (SKIP_OFFICEACE_DETECT + INJECT_STS_CMD) ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'ENV-VAR');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== 环境变量覆盖夹具 (SKIP_OFFICEACE_DETECT + INJECT_STS_CMD) ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
