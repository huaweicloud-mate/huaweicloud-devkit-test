// 环境变量覆盖夹具：HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT + HUAWEICLOUD_INJECT_STS_CMD 边界值矩阵
// 2 变量 × 边界值矩阵（未设置/1/0/true/false/空串/大小写/非法值），验证精确字符串比较行为
// 用法: node env-var-coverage.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/ENV-VAR/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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
  { label: 'unset',       value: undefined, shouldInject: true  },
  { label: '0',            value: '0',        shouldInject: false },
  { label: 'false',       value: 'false',    shouldInject: false },
  { label: '1',            value: '1',        shouldInject: true  },
  { label: 'true',        value: 'true',     shouldInject: true  },
  { label: 'empty',       value: '',         shouldInject: true  },
  { label: 'FALSE-upper', value: 'FALSE',    shouldInject: true  },
  { label: 'False-mixed', value: 'False',    shouldInject: true  },
  { label: '2-illegal',   value: '2',        shouldInject: true  },
];

for (const { label, value, shouldInject } of INJECT_MATRIX) {
  if (value === undefined) delete process.env.HUAWEICLOUD_INJECT_STS_CMD;
  else process.env.HUAWEICLOUD_INJECT_STS_CMD = value;

  const result = resolveStsInjectArgs(testArgs);
  const injects = result.length > 0;
  rec(`ENV-INJECT-${label}`, `HUAWEICLOUD_INJECT_STS_CMD='${label}' -> ${shouldInject ? 'inject' : 'no-inject'}`,
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

// ─── HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT 行为验证 ───
// 生效条件：严格 === '1' → 跳过 OfficeAce 系统探针（return null）
// 其他值（包括 '0'/'true'/''/未设置）→ 照常探针
// SUT: officeace-paths.mjs 导出的 isUsableOfficeaceRoot / readOfficeaceRootMarker / writeOfficeaceRootMarker
//      setup-cli.mjs officeaceCapabilitiesDir() 是 private function，通过导出函数 + 文件系统观测行为

const pathsBase = new URL(`file://${hdkSrc}/officeace-paths.mjs`);
const { isUsableOfficeaceRoot, readOfficeaceRootMarker, writeOfficeaceRootMarker } = await import(pathsBase);

// ① 行为断言：isUsableOfficeaceRoot 对有效目录返回 true（capabilities.json 存在）
{
  const tmpRoot = join(tmpdir(), `env-var-oca-${Date.now()}`);
  mkdirSync(tmpRoot, { recursive: true });
  writeFileSync(join(tmpRoot, 'capabilities.json'), '{}', 'utf8');
  rec('ENV-SKIP-isusable-valid', 'isUsableOfficeaceRoot 对含 capabilities.json 的目录 -> true',
      isUsableOfficeaceRoot(tmpRoot) === true,
      isUsableOfficeaceRoot(tmpRoot), true,
      `dir=${tmpRoot}`);
  rmSync(tmpRoot, { recursive: true, force: true });
}

// ② 行为断言：isUsableOfficeaceRoot 对不存在目录返回 false
{
  const fakeDir = join(tmpdir(), `env-var-fake-${Date.now()}`);
  rec('ENV-SKIP-isusable-invalid', 'isUsableOfficeaceRoot 对不存在目录 -> false',
      isUsableOfficeaceRoot(fakeDir) === false,
      isUsableOfficeaceRoot(fakeDir), false);
}

// ③ 行为断言：writeOfficeaceRootMarker → readOfficeaceRootMarker 往返一致
//   SKIP_OFFICEACE_DETECT 不影响 marker 路径（源码中 SKIP 检查在 marker 之后）
{
  const tmpHome = join(tmpdir(), `env-var-home-${Date.now()}`);
  mkdirSync(join(tmpHome, '.config', 'huaweicloud'), { recursive: true });
  const tmpRoot = join(tmpdir(), `env-var-oca-marker-${Date.now()}`);
  mkdirSync(tmpRoot, { recursive: true });
  writeFileSync(join(tmpRoot, 'capabilities.json'), '{}', 'utf8');

  const oldHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = tmpHome;
  try {
    writeOfficeaceRootMarker(tmpRoot);
    const marker = readOfficeaceRootMarker();
    rec('ENV-SKIP-marker-roundtrip', 'writeOfficeaceRootMarker -> readOfficeaceRootMarker 往返一致',
        marker === tmpRoot, marker, tmpRoot);

    // SKIP='1' 时 marker 仍被读取（SKIP 检查在 marker 之后，不影响 marker 路径）
    process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT = '1';
    const markerWithSkip = readOfficeaceRootMarker();
    rec('ENV-SKIP-marker-unaffected-by-skip', "SKIP='1' 时 readOfficeaceRootMarker 仍返回 marker（SKIP 在 marker 之后）",
        markerWithSkip === tmpRoot, markerWithSkip, tmpRoot,
        'SKIP 检查在 marker 之后，marker 路径不受影响');
    delete process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT;
  } finally {
    if (oldHome === undefined) delete process.env.HUAWEICLOUD_HOME;
    else process.env.HUAWEICLOUD_HOME = oldHome;
    rmSync(tmpRoot, { recursive: true, force: true });
    rmSync(tmpHome, { recursive: true, force: true });
  }
}

// ─── 源码契约快照（非行为断言，不计入行为 PASS 口径）───
// officeaceCapabilitiesDir 是 private function，以下为源码格式验证
const snapshotResults = [];
function recSnapshot(id, title, ok, actual, expected, detail = '') {
  snapshotResults.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  [源码契约快照] ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// 快照①：=== '1' 精确比较
{
  const src = readFileSync(new URL(`file://${hdkSrc}/setup-cli.mjs`), 'utf8');
  const hasStrict1 = src.includes("HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT === '1'");
  recSnapshot('ENV-SKIP-src-strict-compare', '源码: HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT === "1" 精确比较',
      hasStrict1, hasStrict1, true);
}

// 快照②：非 truthy 检查
{
  const src = readFileSync(new URL(`file://${hdkSrc}/setup-cli.mjs`), 'utf8');
  const line = src.split('\n').find((l) => l.includes('SKIP_OFFICEACE_DETECT'));
  const isStrictEqual = line && line.includes("=== '1'");
  const isNotTruthy = !line || !line.includes("if (process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT)");
  recSnapshot('ENV-SKIP-src-not-truthy', '源码: 非 truthy 检查（精确 === "1" 而非 if(env)）',
      isStrictEqual && isNotTruthy,
      { line: line?.trim(), isStrictEqual, isNotTruthy },
      { isStrictEqual: true, isNotTruthy: true });
}

// 清理
clearRuntimeCredentials();
delete process.env.HUAWEICLOUD_INJECT_STS_CMD;
delete process.env.HUAWEICLOUD_DEVKIT_SKIP_OFFICEACE_DETECT;

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
const snapshotPass = snapshotResults.filter((r) => r.ok).length;
const snapshotFail = snapshotResults.filter((r) => !r.ok).length;
console.log(`\n=== 环境变量覆盖夹具 (SKIP_OFFICEACE_DETECT + INJECT_STS_CMD) ===`);
console.log(`  行为断言: pass=${pass} fail=${fail}`);
console.log(`  源码契约快照（非行为断言）: pass=${snapshotPass} fail=${snapshotFail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'ENV-VAR');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(...snapshotResults.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t[源码契约快照] ${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`));
  lines.push(`\n=== 环境变量覆盖夹具 (SKIP_OFFICEACE_DETECT + INJECT_STS_CMD) ===`);
  lines.push(`  行为断言: pass=${pass} fail=${fail}`);
  lines.push(`  源码契约快照（非行为断言）: pass=${snapshotPass} fail=${snapshotFail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
