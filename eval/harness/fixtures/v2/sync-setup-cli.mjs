#!/usr/bin/env node
/**
 * v2 setup-cli 源码副本同步器。
 *
 * 背景：`eval/harness/fixtures/v2/setup-cli.mjs` 不是可执行 shim，而是 **v2 源码副本**
 * （d11-11 / d11-23 用 `readFileSync(hdkSrc/setup-cli.mjs)` 做源码级文本核对：region 询问提示、
 * IAM 401 文案等）。v2 分支一更新，这份副本就落伍，原先靠人工 `cp`（README 维护约定）。
 *
 * 本脚本把那次 `cp` 自动化：
 *   - 源：`<v2 源码根>/plugins/huaweicloud-core/src/setup-cli.ts`
 *   - 目标：本目录的 `setup-cli.mjs`（统一按 LF 落盘，交给 git 的 core.autocrlf 规范化）
 *   - 同时写 `setup-cli.provenance.json`，记下同步自哪个 v2 commit / 校验和 / 行数
 *
 * 用法：
 *   node eval/harness/fixtures/v2/sync-setup-cli.mjs                    # 用默认源 ../_hdk_v2
 *   node eval/harness/fixtures/v2/sync-setup-cli.mjs --src /path/hdk-v2
 *   node eval/harness/fixtures/v2/sync-setup-cli.mjs --check            # 只检查是否落伍（CI 门禁用）
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

/** 归一化行尾：CRLF/CR → LF（内容比对与落盘都用归一化后的形态）。 */
const normalize = (s) => s.replace(/\r\n?/g, '\n');
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const lineCount = (s) => (s === '' ? 0 : s.replace(/\n$/, '').split('\n').length);

function gitInfo(srcRoot) {
  const run = (args) => {
    const r = spawnSync('git', ['-C', srcRoot, ...args], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout.trim() : '';
  };
  const branch = run(['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = run(['rev-parse', '--short', 'HEAD']);
  const dirty = run(['status', '--porcelain']).length > 0;
  return { branch, commit, dirty };
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
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(0);
}

const srcRoot = resolve(args.src || join(REPO_ROOT, '..', '_hdk_v2'));
const srcFile = join(srcRoot, SRC_REL);

if (!existsSync(srcFile)) {
  console.error(`[FAIL] 找不到 v2 源文件：${srcFile}`);
  console.error(`       先 clone/checkout v2 分支（git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk-v2 && cd hdk-v2 && git checkout v2），`);
  console.error(`       或用 --src 指定 v2 源码根（也可用环境变量 HDK_V2_SRC）。`);
  process.exit(1);
}

const srcText = normalize(readFileSync(srcFile, 'utf8'));
const hadTarget = existsSync(TARGET);
const rawTarget = hadTarget ? readFileSync(TARGET, 'utf8') : '';
const oldText = normalize(rawTarget);
// 保留工作区原行尾（本仓 core.autocrlf=true，检出为 CRLF）：换成别的行尾会让 git 每次 diff 都告警。
const targetEol = rawTarget.includes('\r\n') ? '\r\n' : '\n';
const git = gitInfo(srcRoot);
const v2Label = git.commit ? `${git.branch || 'HEAD'}@${git.commit}` : '（源不是 git 仓库 / 无法取版本）';
const same = hadTarget && oldText === srcText;

const meta = {
  source: SRC_REL,
  v2Branch: git.branch,
  v2Commit: git.commit,
  v2Dirty: git.dirty,
  sha256: sha256(srcText),
  lines: lineCount(srcText),
  target: relative(REPO_ROOT, TARGET).split('\\').join('/'),
};

if (args.check) {
  if (!same) {
    const d = approximateDiff(oldText, srcText);
    console.error(`[STALE] setup-cli.mjs 与 v2 源不一致（首次差异在第 ${d.firstDiffLine} 行；近似 +${d.added}/-${d.removed} 行）`);
    console.error(`        v2 ${v2Label} · ${srcFile}`);
    console.error(`        修：node ${relative(REPO_ROOT, fileURLToPath(import.meta.url)).split('\\').join('/')}`);
    process.exit(3);
  }
  console.log(`[OK] setup-cli.mjs 与 v2 源一致（${meta.lines} 行, sha256 ${meta.sha256.slice(0, 12)}…, v2 ${v2Label}）`);
  process.exit(0);
}

if (same) {
  console.log(`[OK] 已是最新，无需同步（${meta.lines} 行, sha256 ${meta.sha256.slice(0, 12)}…）`);
} else {
  const d = approximateDiff(oldText, srcText);
  writeFileSync(TARGET, targetEol === '\r\n' ? srcText.replace(/\n/g, '\r\n') : srcText, 'utf8');
  console.log(hadTarget
    ? `[SYNC] setup-cli.mjs 已更新 → ${meta.lines} 行（首次差异第 ${d.firstDiffLine} 行；近似 +${d.added}/-${d.removed} 行）`
    : `[SYNC] setup-cli.mjs 已生成 → ${meta.lines} 行`);
}
writeFileSync(PROVENANCE, `${JSON.stringify({ ...meta, syncedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
console.log(`       源: ${srcFile}`);
console.log(`       v2 ${v2Label}${git.dirty ? ' (工作区有未提交改动)' : ''}`);
if (git.dirty) console.warn('[WARN] v2 源码工作区是 dirty 的：这份副本可能对应不到任何已发布 commit，测试机对不上时会误判。');