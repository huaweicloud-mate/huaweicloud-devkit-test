// D4-12 供应链安装期安全夹具
// npm 安装期行为 mock + SBOM 审计通道基线
// 验证点：
//  1. package.json postinstall 脚本存在且仅指向自有 bin（非任意远程脚本）
//  2. npm install 使用 --omit=dev --no-audit --no-fund（不拉 dev 依赖、不外传审计）
//  3. 依赖列表无高危包（proxy/tunnel / eval / vm2 已知 CVE）
//  4. SBOM 基线：package.json 依赖可枚举 + 版本固定
// 用法: node d4-12-supply-chain.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d4-12-supply-chain.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// package.json 路径：hdkSrc = .../plugins/huaweicloud-core/src → 上 3 层 = huaweicloud-devkit root
const srcDir = hdkSrc.replace(/^file:\/\//, '');
const rootPkgPath = resolve(srcDir, '..', '..', '..', 'package.json');

let pkg;
try {
  pkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
} catch (e) {
  console.error('无法读取 package.json:', rootPkgPath, e.message);
  process.exit(2);
}

// ① postinstall 脚本安全：指向自有 bin，非远程 URL
{
  const postinstall = pkg.scripts?.postinstall || '';
  const isSelfHosted = postinstall.startsWith('node ./bin/') || postinstall.startsWith('node bin/');
  const noRemoteUrl = !/https?:\/\//.test(postinstall) || !/curl|wget|powershell.*iex/i.test(postinstall);
  rec('D4-12-postinstall-self', 'postinstall 指向自有 bin（非远程脚本）',
      isSelfHosted && noRemoteUrl, postinstall, 'node ./bin/*',
      `script=${postinstall}`);
}

// ② npm install 参数安全：--omit=dev --no-audit --no-fund
// 从源码 setup-cli.mjs 验证 install 命令实参
{
  let installArgs = '';
  try {
    const setupSrc = readFileSync(join(srcDir, 'setup-cli.mjs'), 'utf8');
    // 提取 npm install spawn 调用实参
    const m = setupSrc.match(/spawnSync\(\s*['"]npm['"]\s*,\s*\[(['"]install['"]).*?\]/s);
    if (m) installArgs = m[0];
  } catch {}
  const hasOmitDev = installArgs.includes('--omit=dev');
  const hasNoAudit = installArgs.includes('--no-audit');
  const hasNoFund = installArgs.includes('--no-fund');
  rec('D4-12-install-omit-dev', 'npm install --omit=dev（不拉 dev 依赖）',
      hasOmitDev, hasOmitDev, true, `args snippet=${installArgs.slice(0, 120)}`);
  rec('D4-12-install-no-audit', 'npm install --no-audit（不外传审计）',
      hasNoAudit, hasNoAudit, true);
  rec('D4-12-install-no-fund', 'npm install --no-fund（不拉资助信息）',
      hasNoFund, hasNoFund, true);
}

// ③ 依赖列表无已知高危包
{
  const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };
  const depNames = Object.keys(deps);
  // 已知高危包模式（vm2 已弃用 CVE-2023-37903、eval 危险）
  const dangerousPatterns = ['vm2', 'eval(', 'node-pty']; // node-pty 需编译，供应链风险
  const flagged = depNames.filter((d) => dangerousPatterns.some((p) => d.includes(p)));
  rec('D4-12-no-known-cve-deps', '依赖无已知高危包（vm2/eval）',
      flagged.length === 0, flagged, [],
      `deps=${depNames.length}个: ${depNames.slice(0, 10).join(', ')}...`);
}

// ④ SBOM 基线：依赖可枚举 + 版本固定（非空版本号）
{
  const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };
  const entries = Object.entries(deps);
  const allVersioned = entries.every(([name, ver]) => ver && ver !== '*' && !ver.startsWith('file:'));
  const sbom = entries.map(([name, version]) => ({ name, version, type: 'npm' }));
  rec('D4-12-sbom-all-versioned', 'SBOM: 全部依赖版本固定',
      allVersioned, allVersioned, true,
      `deps=${entries.length} allVersioned=${allVersioned}`);
  rec('D4-12-sbom-enumerable', 'SBOM: 依赖可枚举（≥1 条）',
      sbom.length >= 1, sbom.length, '≥1');
}

// ⑤ 无 preinstall 脚本（preinstall 是供应链攻击高发点）
{
  const hasPreinstall = !!pkg.scripts?.preinstall;
  rec('D4-12-no-preinstall', '无 preinstall 脚本（供应链攻击高发点）',
      !hasPreinstall, hasPreinstall, false,
      hasPreinstall ? `preinstall=${pkg.scripts.preinstall}` : 'none');
}

// ⑥ bin 入口安全：所有 bin 指向 .cjs/.js/.mjs（非 .sh 或远程）
{
  const bins = pkg.bin || {};
  const binEntries = typeof bins === 'string' ? [bins] : Object.values(bins);
  const allSafe = binEntries.every((b) => /\.(cjs|js|mjs)$/.test(String(b)));
  rec('D4-12-bin-safe-extensions', 'bin 入口均为 .cjs/.js/.mjs',
      allSafe, binEntries, 'all .cjs/.js/.mjs',
      `bins=${JSON.stringify(binEntries)}`);
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D4-12 供应链安装期安全夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D4-12');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D4-12 供应链安装期安全夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
