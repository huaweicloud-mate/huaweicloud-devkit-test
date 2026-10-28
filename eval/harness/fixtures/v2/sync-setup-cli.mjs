#!/usr/bin/env node
/**
 * v2 setup-cli 双用文件生成器 / 同步器。
 *
 * `eval/harness/fixtures/v2/setup-cli.mjs` 必须同时满足两组夹具的用法（缺一个都会让结论失真）：
 *
 *   1. **可 spawn 的 CLI** —— D11-2 / D11-20 / D11-23 / D11-43 会 `node <hdkSrc>/setup-cli.mjs <args>`
 *      直接跑它（`auth init` / `doctor` / `install`），断言读 stdout/stderr/exit code。
 *   2. **源码文本载体** —— D11-10 / D11-11 / D11-15 / D11-23 会 `readFileSync` 本文件做源码级文案核对
 *      （AK/SK/令牌/region 提示母语化、region 显式询问与 `cn-north-4` 回落、`--target` 取值全集、安全披露文案）。
 *
 * 纯源码拷贝不能 spawn（TS 语法 → `SyntaxError: Unexpected identifier 'DependencyId'`）；
 * 纯 bridge 又过不了文本核对。故生成物 = **bridge 前置代码 + 逐行 `//` 注释化的 v2 源码副本**：
 * 注释前缀不改变任何被 `includes` / 正则匹配的文本，两组判据都能成立。
 *
 * 用法：
 *   node eval/harness/fixtures/v2/sync-setup-cli.mjs                    # 默认源 ../_hdk_v2
 *   node eval/harness/fixtures/v2/sync-setup-cli.mjs --src /path/hdk-v2
 *   node eval/harness/fixtures/v2/sync-setup-cli.mjs --check            # 只检查是否落伍（CI/派发前门禁）
 *
 * 退出码：0 = 已是最新（或同步成功）；3 = --check 发现落伍；1 = 源文件找不到 / 参数错。
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));        // <repo>/eval/harness/fixtures/v2
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..', '..', '..');      // <repo>
const TARGET = join(SCRIPT_DIR, 'setup-cli.mjs');
const PROVENANCE = join(SCRIPT_DIR, 'setup-cli.provenance.json');
const SRC_REL = 'plugins/huaweicloud-core/src/setup-cli.ts';        // v2 分支内路径
const EMBED_MARK = '// ===== 以下为 v2 源码副本';

// 生成物前置：可 spawn 的 CLI bridge（透传 argv / stdio / env / cwd / exit code）。
// 注意：本段会被逐字写进生成物，故不使用模板字符串插值（改用字符串拼接），避免生成器与生成物混淆。
const BRIDGE = [
  '#!/usr/bin/env node',
  '/**',
  ' * v2 setup-cli —— 双用文件（由 sync-setup-cli.mjs 生成，禁止手改）。',
  ' *',
  ' * 角色 1（可 spawn 的 CLI）：夹具会 `node <hdkSrc>/setup-cli.mjs <args>` 直接跑它',
  ' *   → 本文件把 argv / stdio / env / cwd / 退出码原样透传给 v2 build 产物 `V2_DIST/setup-cli.js`。',
  ' *   （历史缺陷：早先这里放的是 TS 源码逐字拷贝 → spawn 直接 SyntaxError，D11-2/20/23/43 的断言读到报错文本。）',
  ' * 角色 2（源码文本载体）：夹具还会 readFileSync 本文件做源码级文案核对（d11-10/11/15/23）',
  ' *   → 文件末尾以 `// ` 逐行注释形式附上 v2 源码副本（逐字，仅加注释前缀）。',
  ' *',
  ' * 重同步 / 复核：`node eval/harness/fixtures/v2/sync-setup-cli.mjs`（--check 只检查，落伍 exit=3）。',
  ' */',
  "import { spawnSync } from 'node:child_process';",
  "import { existsSync } from 'node:fs';",
  "import { join } from 'node:path';",
  "import { v2dist } from './_loader.mjs';",
  '',
  'let dist;',
  'try {',
  '  dist = v2dist();',
  '} catch (err) {',
  "  console.error('[setup-cli bridge] ' + (err && err.message ? err.message : String(err)));",
  '  process.exit(2);',
  '}',
  '',
  "const entry = join(dist, 'setup-cli.js');",
  'if (!existsSync(entry)) {',
  "  console.error('[setup-cli bridge] 找不到 v2 CLI 产物：' + entry);",
  "  console.error('                  先 build v2（npm ci && npm run build），并令 V2_DIST 指向 dist 目录。');",
  '  process.exit(2);',
  '}',
  '',
  '// stdio 继承：夹具用管道 spawn 本文件，输出与退出码照原样透传（NO_COLOR / LC_ALL / COLUMNS 等环境随之继承）。',
  'const res = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], {',
  "  stdio: 'inherit',",
  '  env: process.env,',
  '  cwd: process.cwd(),',
  '});',
  'if (res.error) {',
  "  console.error('[setup-cli bridge] 启动 v2 CLI 失败：' + res.error.message);",
  '  process.exit(2);',
  '}',
  'process.exit(Number.isInteger(res.status) ? res.status : 1);',
  '',
].join('\n');

function parseArgs(argv) {
  const out = { src: process.env.HDK_V2_SRC || '', check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--src') out.src = argv[++i] || '';
    else if (a === '--check') out.check = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (!a.startsWith('--')) out.src = a;
    else throw new Error(`未知参数: ${a}`);
  }
  return out;
}

/** 归一化行尾：CRLF/CR → LF（内容比对与语义都按归一化后的形态）。 */
const normalize = (s) => s.replace(/\r\n?/g, '\n');
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const lineCount = (s) => (s === '' ? 0 : s.replace(/\n$/, '').split('\n').length);

/** 源码文本 → 逐行 `//` 注释块（任何内容都安全：块注释终止序列、反引号、模板插值都不会破坏）。 */
function embedSource(src) {
  return src
    .replace(/\n$/, '')
    .split('\n')
    .map((l) => (l === '' ? '//' : `// ${l}`))
    .join('\n');
}

/** 生成完整产物：bridge 前置 + 源码副本注释块。 */
function render(srcText) {
  const head = [
    '',
    `${EMBED_MARK}（${SRC_REL}，逐字，仅逐行加 "// " 前缀）=====`,
    '// 用途：夹具 readFileSync 源码级文案核对（d11-10/11/15/23）。注释前缀不改变任何被 includes / 正则匹配的文本。',
    '// 与本目录 README「setup-cli 双用文件」节一致；去前缀逐字比对见该节命令。',
  ].join('\n');
  return `${BRIDGE}${head}\n${embedSource(srcText)}\n`;
}

function gitInfo(srcRoot) {
  const run = (args) => {
    const r = spawnSync('git', ['-C', srcRoot, ...args], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout.trim() : '';
  };
  return {
    branch: run(['rev-parse', '--abbrev-ref', 'HEAD']),
    commit: run(['rev-parse', '--short', 'HEAD']),
    dirty: run(['status', '--porcelain']).length > 0,
  };
}

/** 近似差异统计（行集合差，不做 LCS：够用于"变了多少"的提示，不声称是精确 diff）。 */
function approximateDiff(oldText, newText) {
  if (oldText === newText) return { added: 0, removed: 0, firstDiffLine: 0 };
  const o = oldText.split('\n');
  const n = newText.split('\n');
  let firstDiffLine = 0;
  for (let i = 0; i < Math.max(o.length, n.length); i += 1) {
    if (o[i] !== n[i]) { firstDiffLine = i + 1; break; }
  }
  const tally = (arr) => arr.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
  const om = tally(o);
  const nm = tally(n);
  let added = 0;
  let removed = 0;
  for (const [l, c] of nm) added += Math.max(0, c - (om.get(l) || 0));
  for (const [l, c] of om) removed += Math.max(0, c - (nm.get(l) || 0));
  return { added, removed, firstDiffLine };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[1] || '');
  process.exit(0);
}

const srcRoot = resolve(args.src || join(REPO_ROOT, '..', '_hdk_v2'));
const srcFile = join(srcRoot, SRC_REL);

if (!existsSync(srcFile)) {
  console.error(`[FAIL] 找不到 v2 源文件：${srcFile}`);
  console.error('       先 clone/checkout v2（git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk-v2 && cd hdk-v2 && git checkout v2），');
  console.error('       或用 --src 指定 v2 源码根（也可用环境变量 HDK_V2_SRC）。');
  process.exit(1);
}

const srcText = normalize(readFileSync(srcFile, 'utf8'));
const generated = render(srcText);
const hadTarget = existsSync(TARGET);
const rawTarget = hadTarget ? readFileSync(TARGET, 'utf8') : '';
const oldText = normalize(rawTarget);
// 保留工作区原行尾（本仓 core.autocrlf=true，检出为 CRLF）：换成别的行尾会让 git 每次 diff 都告警。
const targetEol = rawTarget.includes('\r\n') ? '\r\n' : '\n';
const git = gitInfo(srcRoot);
const v2Label = git.commit ? `${git.branch || 'HEAD'}@${git.commit}` : '（源不是 git 仓库 / 无法取版本）';
const same = hadTarget && oldText === generated;

const meta = {
  generator: 'sync-setup-cli.mjs',
  role: 'dual（可 spawn 的 v2 CLI bridge + 源码副本载体）',
  source: SRC_REL,
  v2Branch: git.branch,
  v2Commit: git.commit,
  v2Dirty: git.dirty,
  sourceSha256: sha256(srcText),
  sourceLines: lineCount(srcText),
  target: relative(REPO_ROOT, TARGET).split('\\').join('/'),
  targetSha256: sha256(generated),
  targetLines: lineCount(generated),
};

if (args.check) {
  if (!same) {
    const d = approximateDiff(oldText, generated);
    console.error(`[STALE] setup-cli.mjs 与「v2 源重生成结果」不一致（首次差异第 ${d.firstDiffLine} 行；近似 +${d.added}/-${d.removed} 行）`);
    console.error(`        v2 ${v2Label} · ${srcFile}`);
    console.error('        两种可能：① v2 源码更新了 → 重跑同步；② 有人手改了产物 → 同样重跑同步覆盖。');
    console.error(`        修：node ${relative(REPO_ROOT, fileURLToPath(import.meta.url)).split('\\').join('/')}`);
    process.exit(3);
  }
  console.log(`[OK] setup-cli.mjs 与 v2 源一致（产物 ${meta.targetLines} 行 / 源码 ${meta.sourceLines} 行, sha256 ${meta.targetSha256.slice(0, 12)}…, v2 ${v2Label}）`);
  process.exit(0);
}

if (same) {
  console.log(`[OK] 已是最新，无需同步（产物 ${meta.targetLines} 行 / 源码 ${meta.sourceLines} 行, sha256 ${meta.targetSha256.slice(0, 12)}…）`);
} else {
  const d = approximateDiff(oldText, generated);
  writeFileSync(TARGET, targetEol === '\r\n' ? generated.replace(/\n/g, '\r\n') : generated, 'utf8');
  console.log(hadTarget
    ? `[SYNC] setup-cli.mjs 已重生成 → ${meta.targetLines} 行（bridge + ${meta.sourceLines} 行源码副本；首次差异第 ${d.firstDiffLine} 行，近似 +${d.added}/-${d.removed} 行）`
    : `[SYNC] setup-cli.mjs 已生成 → ${meta.targetLines} 行（bridge + ${meta.sourceLines} 行源码副本）`);
}
writeFileSync(PROVENANCE, `${JSON.stringify({ ...meta, syncedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
console.log(`       源: ${srcFile}`);
console.log(`       v2 ${v2Label}${git.dirty ? ' (工作区有未提交改动)' : ''}`);
if (git.dirty) console.warn('[WARN] v2 源码工作区是 dirty 的：这份副本可能对应不到任何已发布 commit，测试机对不上时会误判。');