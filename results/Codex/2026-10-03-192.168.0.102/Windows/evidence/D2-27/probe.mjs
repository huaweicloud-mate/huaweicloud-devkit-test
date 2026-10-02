// D2-27 KooCLI 版本管理夹具
// getKooCliVersion / parseHcloudVersion / compareVersion / kooCliDownloadBase / KOO_CLI_BASE
// 用法: node d2-27-koocli-version.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d2-27-koocli-version.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const mod = await import(new URL(`file://${hdkSrc}/koocli-version.mjs`));

// ① KOO_CLI_BASE 下载基址
rec('D2-27-base-url', 'KOO_CLI_BASE 下载基址正确',
    mod.KOO_CLI_BASE === 'https://cn-north-4-hdn-koocli.obs.cn-north-4.myhuaweicloud.com/cli',
    mod.KOO_CLI_BASE, 'https://cn-north-4-hdn-koocli.obs.cn-north-4.myhuaweicloud.com/cli');

// ② getKooCliVersion 从 package.json 读取
const ver = mod.getKooCliVersion();
rec('D2-27-get-version', 'getKooCliVersion 返回版本号', ver !== null && /\d+\.\d+\.\d+/.test(ver),
    ver, 'string semver', `actual=${ver}`);

// ③ parseHcloudVersion 解析 hcloud version 输出
{
  const cases = [
    { input: 'KooCLI Version: 7.2.12', expected: '7.2.12' },
    { input: 'hcloud 6.3.5 (Huawei Cloud CLI)', expected: '6.3.5' },
    { input: '7.2.12', expected: '7.2.12' },
    { input: 'version 5.0.0+20260101', expected: '5.0.0+20260101' },
    { input: '', expected: null },
    { input: null, expected: null },
  ];
  let allOk = true;
  for (const c of cases) {
    const r = mod.parseHcloudVersion(c.input);
    if (r !== c.expected) {
      allOk = false;
      console.log(`    parseHcloudVersion(${JSON.stringify(c.input)}) => ${JSON.stringify(r)} (期望 ${JSON.stringify(c.expected)})`);
    }
  }
  rec('D2-27-parse-version', 'parseHcloudVersion 解析多格式版本输出', allOk, allOk, true);
}

// ④ compareVersion 三向比较
{
  const cases = [
    { a: '7.2.12', b: '7.2.12', expected: 0 },
    { a: '7.2.13', b: '7.2.12', expected: 1 },
    { a: '7.2.11', b: '7.2.12', expected: -1 },
    { a: '8.0.0', b: '7.99.99', expected: 1 },
    { a: '7.2.12+build1', b: '7.2.12', expected: 0 }, // pre-release suffix stripped
    { a: '', b: '1.0.0', expected: -1 },
  ];
  let allOk = true;
  for (const c of cases) {
    const r = mod.compareVersion(c.a, c.b);
    if (r !== c.expected) {
      allOk = false;
      console.log(`    compareVersion(${c.a}, ${c.b}) => ${r} (期望 ${c.expected})`);
    }
  }
  rec('D2-27-compare-version', 'compareVersion 三向比较正确', allOk, allOk, true);
}

// ⑤ kooCliDownloadBase 组合 URL
{
  const base = mod.kooCliDownloadBase();
  const ver = mod.getKooCliVersion();
  const expected = `${mod.KOO_CLI_BASE}/${ver}`;
  rec('D2-27-download-base', 'kooCliDownloadBase 组合基址+版本',
      base === expected, base, expected);
  rec('D2-27-download-base-contains-version', 'downloadBase 含版本号',
      base.includes(ver), true, `base=${base}`);
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D2-27 KooCLI 版本管理夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D2-27');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D2-27 KooCLI 版本管理夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
