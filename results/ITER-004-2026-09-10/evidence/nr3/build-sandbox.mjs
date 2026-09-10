// 构建 NR3 隔离测试沙箱（2026-09-10 ITER-004 补充轮）
// 用法: node build-sandbox.mjs <hdk仓库根> <沙箱输出目录>
// 产出: S/app-old(1.1.2原码) S/app-next(1.1.3-next.2原码) S/app-fix-s(修复+ver1.1.2) S/app-fix-p(修复+ver1.1.3-next.2)
//       S/fixtures/fj-old.tgz(1.1.2) S/fixtures/fj-new.tgz(1.1.3=next.2码+修复)  S/scenarios/*.json  S/MANIFEST.md
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = resolve(process.argv[2] || 'C:/Users/Administrator/devkit-test/hdk');
const S = resolve(process.argv[3] || join(__dirname, '.sandbox'));

const SHA_112 = '09a59b937eb3b219bc8a9f03faec2092ef7372c5'; // npm latest=1.1.2 gitHead
const SHA_NEXT2 = 'c6c0965f0bdf6181abef65edb6fee7ed2115cd68'; // npm next=1.1.3-next.2 gitHead
const PKG_FIX = '1.1.3'; // 受控"下一个正式版"（next.2 代码 + shell:true 修复补丁）

const now = new Date();
const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: true, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} -> exit ${r.status}: ${(r.stderr || '').slice(0, 800)}`);
  return r.stdout;
}
function outDir(...p) { const d = join(S, ...p); mkdirSync(d, { recursive: true }); return d; }
function gitArchive(sha, destDir) {
  // Windows bsdtar 无法处理 git archive 内中文文件名（Invalid empty pathname）；commit 不在任何本地 ref（历史 sha 直取）
  // → 直接在原始仓库上建 worktree 检出（git 原生处理中文文件名），对象已在本仓库对象库
  run('git', ['-C', HDK, 'worktree', 'add', '--detach', '--quiet', destDir, sha]);
  console.log(`  worktree ${sha.slice(0, 8)} -> ${destDir}`);
}
function patchShellFix(appDir) {
  const f = join(appDir, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
  let src = readFileSync(f, 'utf8');
  src = src.replace(/\r\n/g, '\n'); // 行尾规范化后再打补丁
  const orig = src;
  // 1) queryDistTagsSync：spawnSync('npm.cmd') 无 shell → Windows EINVAL；加 shell:true → cmd.exe 死锁（2026-09-10 实测 ETIMEDOUT）。
  //    FIX(sim)= 以 node.exe 直跑 npm-cli.js（不经 .cmd/shell），修复方向=弃用 .cmd 直启或改 npm JS API
  const sStart = 'export function queryDistTagsSync({ timeoutMs = 5000, cwd } = {}) {';
  const sEnd = 'export function queryDistTags({';
  const si = src.indexOf(sStart);
  const ei = src.indexOf(sEnd);
  if (si < 0 || ei < 0 || ei <= si) throw new Error('patch1 (queryDistTagsSync) markers not found');
  const syncNew = `// FIX(sim, 2026-09-10): Windows spawnSync('npm.cmd') 无 shell:true -> EINVAL；加 shell:true -> cmd.exe 死锁（实测 ETIMEDOUT）。
// 以 node.exe 直接运行 npm-cli.js（真实 npm view，不经 .cmd/shell）。上游修复方向=统一弃用 .cmd 直启或改 npm JS API。
const NPM_CLI = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const NPX_CLI = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js'); // npm10 的 npx-cli 在 npm 包内（独立 npx 目录不存在——2026-09-10 实证）
export function queryDistTagsSync({ timeoutMs = 5000, cwd } = {}) {
  try {
    const result = spawnSync(process.execPath, [NPM_CLI, 'view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8',
      timeout: timeoutMs,
      windowsHide: true,
      cwd,
    });
    if (!result || result.status !== 0) return null;
    return parseDistTagsOutput(result.stdout);
  } catch (error) {
    return null;
  }
}

export function queryDistTags({`;
  src = src.slice(0, si) + syncNew + src.slice(ei + sEnd.length);
  // 2) queryDistTags async spawn 加 shell:true（async 形态实测可用，属 #554 建议方向）
  src = src.replace(
    "child = spawn(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {\n        windowsHide: true",
    "child = spawn(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {\n        shell: true,\n        windowsHide: true",
  );
  // 3) defaultSpawn：npx.cmd spawnSync 同款 Windows 问题 -> 以 node.exe 跑 npx-cli.js
  const dStart = 'function defaultSpawn(command, args, options) {';
  const dEnd = 'function restartMessage(target) {';
  const di = src.indexOf(dStart);
  const ddi = src.indexOf(dEnd);
  if (di < 0 || ddi < 0 || ddi <= di) throw new Error('patch3 (defaultSpawn) markers not found');
  const spawnNew = `function defaultSpawn(command, args, options) {
  // FIX(sim, 2026-09-10): upgradePackage 的 npx.cmd spawnSync 在 Windows 同样 EINVAL/死锁 -> node.exe 直跑 npx-cli.js（需 npm_execpath 上下文）
  if (command === 'npx.cmd' || command === 'npx') {
    return spawnSync(process.execPath, [NPX_CLI, ...args], {
      ...options,
      shell: false,
      env: { ...process.env, ...(options.env || {}), npm_execpath: NPM_CLI },
    });
  }
  return spawnSync(command, args, options);
}

`;
  src = src.slice(0, di) + spawnNew + src.slice(ddi);
  if (src === orig) throw new Error(`patch failed (no change): ${f}`);
  const n = (src.match(/shell: true/g) || []).length;
  if (n < 1) throw new Error(`patch incomplete: shell:true count=${n}（期望 >=1）`);
  if (!src.includes('NPM_CLI') || !src.includes('NPX_CLI')) throw new Error('patch incomplete: NPM_CLI/NPX_CLI 未注入');
  writeFileSync(f, src, 'utf8');
  return n;
}
function setVersion(appDir, version) {
  const f = join(appDir, 'package.json');
  const pkg = JSON.parse(readFileSync(f, 'utf8'));
  pkg.version = version;
  writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}
function sha1hex(file) { return createHash('sha1').update(readFileSync(file)).digest('hex'); }
function sha512b64(file) { return createHash('sha512').update(readFileSync(file)).digest('base64'); }

async function main() {
  // 带重试的沙箱清理（EBUSY 瞬态句柄）
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      rmSync(S, { recursive: true, force: true, maxRetries: 6, retryDelay: 500 });
      break;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  try { run('git', ['-C', HDK, 'worktree', 'prune']); } catch {} // 清上次失败运行残留的 worktree 登记
  const apps = outDir('app-old'); outDir('app-next'); outDir('app-fix-s'); outDir('app-fix-p'); outDir('pack-src-new');
  const fixtures = outDir('fixtures'); const scenarios = outDir('scenarios');

  console.log(`[build-sandbox] 沙箱=${S}  执行时刻=${ts}`);
  console.log('[1/5] git archive 抽取固定 commit 原码...');
  gitArchive(SHA_112, apps);
  gitArchive(SHA_NEXT2, join(S, 'app-next'));
  gitArchive(SHA_NEXT2, join(S, 'app-fix-s'));
  gitArchive(SHA_NEXT2, join(S, 'app-fix-p'));
  gitArchive(SHA_NEXT2, join(S, 'pack-src-new'));

  console.log('[2/5] 打 shell:true 修复补丁...');
  const p1 = patchShellFix(join(S, 'app-fix-s'));
  const p2 = patchShellFix(join(S, 'app-fix-p'));
  const p3 = patchShellFix(join(S, 'pack-src-new'));
  console.log(`  app-fix-s/app-fix-p/pack-src-new 各补丁 shell:true x${p1}/${p2}/${p3}`);
  // 版本固定
  setVersion(join(S, 'app-fix-s'), '1.1.2'); // 修复后 stable 用户场景
  setVersion(join(S, 'pack-src-new'), PKG_FIX); // 受控新版 1.1.3
  // app-old 版本 1.1.2 / app-next 1.1.3-next.2 天然正确

  console.log('[3/5] npm pack 生成受控 tarball...');
  run('npm', ['pack', '--pack-destination', fixtures], { cwd: join(S, 'app-old') });
  run('npm', ['pack', '--pack-destination', fixtures], { cwd: join(S, 'pack-src-new') });
  copyFileSync(join(fixtures, 'huaweicloud-devkit-1.1.2.tgz'), join(fixtures, 'fj-old.tgz'));
  copyFileSync(join(fixtures, 'huaweicloud-devkit-1.1.3.tgz'), join(fixtures, 'fj-new.tgz'));
  for (const f of readdirSync(fixtures)) if (f.startsWith('huaweicloud-devkit-')) rmSync(join(fixtures, f), { force: true });
  const oldSh1 = sha1hex(join(fixtures, 'fj-old.tgz')), oldSh512 = sha512b64(join(fixtures, 'fj-old.tgz'));
  const newSh1 = sha1hex(join(fixtures, 'fj-new.tgz')), newSh512 = sha512b64(join(fixtures, 'fj-new.tgz'));
  console.log(`  fj-old.tgz 1.1.2 sha1=${oldSh1.slice(0, 12)}... | fj-new.tgz ${PKG_FIX} sha1=${newSh1.slice(0, 12)}...`);

  console.log('[4/5] 写 fixture 场景...');
  // 版本表覆盖所有场景引用的 dist-tag（npm view 对 latest 指向不存在的版本会报错——2026-09-10 实证）
  const T = { '1.1.1': 'fj-old.tgz', '1.1.2': 'fj-old.tgz', '1.1.3': 'fj-new.tgz', '1.1.3-next.2': 'fj-new.tgz', '1.1.4': 'fj-new.tgz', '1.1.4-next.1': 'fj-new.tgz' };
  const SH = { '1.1.1': oldSh1, '1.1.2': oldSh1, '1.1.3': newSh1, '1.1.3-next.2': newSh1, '1.1.4': newSh1, '1.1.4-next.1': newSh1 };
  const IN = { '1.1.1': `sha512-${oldSh512}`, '1.1.2': `sha512-${oldSh512}`, '1.1.3': `sha512-${newSh512}`, '1.1.3-next.2': `sha512-${newSh512}`, '1.1.4': `sha512-${newSh512}`, '1.1.4-next.1': `sha512-${newSh512}` };
  const base = { tarballs: T, shasums: SH, integrity: IN };
  const scenariosMap = {
    'sc-consistent.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.2', next: '1.1.3-next.2' } },
    'sc-stable-new.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } },
    'sc-upgrade-avail.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } },
    'sc-mirror-lag1.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.1', next: null } },
    'sc-mirror-lag2.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.2' } },
    'sc-pre-next.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.4-next.1' } },
    'sc-next-new.json': { ...base, mode: 'ok', 'dist-tags': { latest: '1.1.4', next: null } },
    'sc-error500.json': { ...base, mode: 'error500', 'dist-tags': { latest: '1.1.3', next: null } },
    'sc-badjson.json': { ...base, mode: 'badjson', 'dist-tags': { latest: '1.1.3', next: null } },
    'sc-halt.json': { ...base, mode: 'halt', 'dist-tags': { latest: '1.1.3', next: null } },
    'sc-delay-ok-300.json': { ...base, mode: 'ok', delayMs: 300, 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } },
    'sc-delay-ok-1500.json': { ...base, mode: 'ok', delayMs: 1500, 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } },
  };
  for (const [name, fx] of Object.entries(scenariosMap)) writeFileSync(join(scenarios, name), JSON.stringify(fx, null, 2), 'utf8');

  // 清理 worktree 元数据（保留检出文件：删各 app 根 .git 标记文件后 prune）
  for (const app of ['app-old', 'app-next', 'app-fix-s', 'app-fix-p', 'pack-src-new']) {
    try {
      rmSync(join(S, app, '.git'), { force: true });
    } catch {}
  }
  try {
    run('git', ['-C', HDK, 'worktree', 'prune']);
  } catch {}

  console.log('[5/5] 写 MANIFEST...');
  writeFileSync(join(S, 'MANIFEST.md'), `# NR3 版本升级提醒——隔离测试沙箱来源清单
> **生成时间**：${ts}（北京时间）

| 项 | 值 |
|---|---|
| 沙箱根 | \`${S}\` |
| 正式版 1.1.2 | git \`09a59b937eb3\`（npm gitHead，发布 2026-09-09T11:03Z）→ \`app-old\` |
| next.2 1.1.3-next.2 | git \`c6c0965f0bdf\`（npm gitHead，发布 2026-09-10T01:22Z）→ \`app-next\`、\`app-fix-s\`、\`app-fix-p\`、\`pack-src-new\` |
| shell:true 修复补丁 | update-check.mjs 三处（queryDistTagsSync / queryDistTags / defaultSpawn），仅存在于 app-fix-* 与 pack-src-new；app-old/app-next 保持原码（0 处 shell:true） |
| 受控版本 | fj-old.tgz=1.1.2（正式版原码）；fj-new.tgz=${PKG_FIX}（next.2 原码+修复补丁，版本号受控非官方发布线） |
| npm pack | \`npm pack --pack-destination <fixtures>\`（app-old/app-fix-s 副本） |
| fixture 场景 | scenarios/*.json（dist-tags/tarball/错误注入可热切换） |
| 隔离 | 各 profile 运行期注入 HOME/USERPROFILE/APPDATA/LOCALAPPDATA/HUAWEICLOUD_HOME/npm_config_cache 至 \`home-<profile>\`，不触碰真实用户目录 |
`, 'utf8');
  console.log(`[done] 沙箱构建完成: ${S}`);
}
main().catch((e) => { console.error('BUILD FAILED:', e); process.exit(1); });