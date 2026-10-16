// run-ux.mjs：UX 体验用例（D11）夹具批量运行器
//
// 与 run-all.mjs 的差别（四条）：
//   1. **自动发现** `d11-*.mjs` —— 新增 D11 夹具无需改清单；
//   2. **内置宿主隔离** —— 为每个夹具创建空 HOME/USERPROFILE 再运行，
//      杜绝真实凭证(~/.config/huaweicloud)、KooCLI(~/.hcloud)、码道(~/.codeartsdoer)
//      污染"未登录态"（体验用例的可判定性前提）；
//   3. **设计状态门禁（NOT_RUN）** —— 读 `test-cases/ux/用例矩阵-体验级.csv` 的「依赖」列：
//      凡标注 `契约依赖: <字段> 待冻结` 的用例，其验收基准依赖尚未冻结的新契约/封装，
//      冻结前**不可判 FAIL**（否则把"契约未定稿"误记成"需求缺口"）。
//      默认**不执行**、状态记 `NOT_RUN`、不计入 PASS/FAIL/BLOCKED、不影响退出码；
//      加 `--run-frozen` 可照跑一遍（结果仍记 NOT_RUN，只用于看趋势，不改变口径）。
//   4. **需求验收退出码语义** —— 区别于"harness 坏了"：
//        exit 0 = 无失败（全部 PASS，或剩余 NOT_RUN/BLOCKED 不构成失败）
//        exit 1 = NOT_IMPLEMENTED（存在需求验收未达标，属**已知缺口**，非 harness 故障）
//        exit 2 = BLOCKED（宿主/环境不满足）或 HARNESS_ERROR（夹具自身崩溃，结果不可判定）
//      注意：夹具崩溃与"需求未实现"同为非 0 退出，靠 ux-common 的收尾哨兵（env UX_SENTINEL）
//      区分 —— 没走到 finish/blocked 就退出的，计为 HARNESS_ERROR（属 harness 故障，不计入需求缺口）。
//
// 用法: node eval/harness/fixtures/run-ux.mjs [hdk src] [--evid <dir>] [--json <path>] [--run-frozen]
//       hdk src 可省略 —— 依次尝试 env HUAWEICLOUD_DEVKIT_HOME / HDK_PATH / sibling ../hdk
//       --evid 逐夹具落 stdout.txt（人可读证据）；--json 落**结构化汇总**
//       （逐夹具 + 逐断言 + 四态计数），供看板/门禁脚本直接消费。
//       未显式给 --evid 时，--json 会自动建临时证据目录自我满足，聚合后清理。
// CI 口径：实现到位前以 continue-on-error 记录趋势（同 replay-trend），到位后提升为硬门禁。
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const DESIGN_CSV = join(REPO_ROOT, 'test-cases', 'ux', '用例矩阵-体验级.csv');

function resolveHdkSrc() {
  const srcOf = (root) => join(root, 'plugins', 'huaweicloud-core', 'src');
  for (const key of ['HUAWEICLOUD_DEVKIT_HOME', 'HDK_PATH']) {
    const val = process.env[key];
    if (val && existsSync(join(srcOf(val), 'tools.mjs'))) return { src: srcOf(val), tag: `env ${key}` };
  }
  const sibling = join(REPO_ROOT, '..', 'hdk');
  if (existsSync(join(srcOf(sibling), 'tools.mjs'))) return { src: srcOf(sibling), tag: 'sibling ../hdk' };
  return null;
}

// 最小 CSV 行解析：支持双引号包裹字段与字段内逗号（D11 矩阵的文案列含逗号）。
// 已知边界：字段内不含换行（gen_ux.py 生成的字段均为单行）。
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { inQ = false; }
      } else { cur += ch; }
    } else if (ch === '"') { inQ = true; }
    else if (ch === ',') { out.push(cur); cur = ''; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

// 读设计矩阵，建「夹具文件 → {id, frozen}」映射：权威映射取「自动化建议」列的 `fixture:<路径>`。
// 读不到矩阵时 **fail-open + 显式告警**（不把"自身缺文件"变成 BLOCKED），并在结构化输出里标记。
function loadDesignGate() {
  const rel = 'test-cases/ux/用例矩阵-体验级.csv';
  const empty = { available: false, source: rel, byFixture: new Map(), frozenIds: [] };
  if (!existsSync(DESIGN_CSV)) return empty;
  const text = readFileSync(DESIGN_CSV, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return empty;
  const head = parseCsvLine(lines[0]);
  const iId = head.indexOf('ID');
  const iDep = head.indexOf('依赖');
  const iAuto = head.indexOf('自动化建议');
  if (iId < 0 || iDep < 0 || iAuto < 0) return empty;
  const byFixture = new Map();
  const frozenIds = [];
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line);
    const id = (c[iId] || '').trim();
    const frozen = (c[iDep] || '').includes('契约依赖');
    if (frozen) frozenIds.push(id);
    for (const m of (c[iAuto] || '').matchAll(/fixture:([^\s,;]+)/g)) {
      const base = m[1].replace(/\\/g, '/').split('/').pop();
      byFixture.set(base, { id, frozen });
    }
  }
  return { available: true, source: rel, byFixture, frozenIds };
}

const argv = process.argv.slice(2);
const evidIdx = argv.indexOf('--evid');
const jsonIdx = argv.indexOf('--json');
const JSON_OUT = jsonIdx > -1 ? argv[jsonIdx + 1] : null;
let EVID = evidIdx > -1 ? argv[evidIdx + 1] : null;
const RUN_FROZEN = argv.includes('--run-frozen');
const positional = argv.filter(
  (a, i) =>
    !a.startsWith('--') &&
    (evidIdx === -1 || i !== evidIdx + 1) &&
    (jsonIdx === -1 || i !== jsonIdx + 1),
);
let hdkSrc = positional[0];
let hdkTag = 'argv';
if (!hdkSrc) {
  const r = resolveHdkSrc();
  if (!r) {
    console.error('无法定位 hdk 源码：传 <hdk src> 或设 HUAWEICLOUD_DEVKIT_HOME / HDK_PATH，或将 hdk clone 到测试仓父目录。');
    process.exit(2);
  }
  hdkSrc = r.src;
  hdkTag = r.tag;
}

const fixtures = readdirSync(__dirname).filter((f) => /^d11-.*\.mjs$/.test(f)).sort();
if (fixtures.length === 0) {
  console.error('[UX] 未发现 d11-*.mjs 夹具');
  process.exit(2);
}

// 设计状态门禁：契约依赖待冻结的夹具 → NOT_RUN（默认不执行）
const gate = loadDesignGate();
const isFrozen = (f) => gate.byFixture.get(f)?.frozen === true;
const frozenFiles = fixtures.filter(isFrozen);
if (!gate.available) {
  console.warn(`[UX] 警告：未读到设计矩阵 ${gate.source} → 设计状态门禁未生效（不会把契约待冻结用例标 NOT_RUN）`);
} else if (frozenFiles.length > 0) {
  const ids = frozenFiles.map((f) => gate.byFixture.get(f)?.id || f).join(', ');
  console.log(`[UX] 设计状态门禁：${frozenFiles.length} 个夹具依赖未冻结契约 → NOT_RUN（不计入 PASS/FAIL/BLOCKED）: ${ids}`);
  if (RUN_FROZEN) console.log('[UX] --run-frozen 已开启：这些夹具会照跑一遍，但结果仍记 NOT_RUN（仅供趋势观察）');
}

// --json 需要逐夹具 result.json sidecar；未显式给 --evid 时自动建临时目录，聚合后清理。
let TMP_EVID = false;
if (JSON_OUT && !EVID) {
  EVID = mkdtempSync(join(tmpdir(), 'ux-evid-'));
  TMP_EVID = true;
}

// 隔离宿主：**每个夹具一个全新空 HOME**（不碰真实宿主）。
// 之所以逐夹具重建而非共用一个：夹具可能写入 S1 凭证（如 D11-41 的占位符遮蔽场景），
// 共用 HOME 会让后续夹具的前置门误判「宿主受污染」→ 夹具顺序相关的假 BLOCKED。
console.log(`[UX] hdk src = ${hdkSrc}  (${hdkTag})`);
console.log(`[UX] 隔离宿主: 每个夹具独立空 HOME/USERPROFILE（位于 ${tmpdir()}）`);
console.log(`[UX] 待运行夹具 ${fixtures.length} 个: ${fixtures.join(', ')}`);

const summary = [];
const sentinelDir = mkdtempSync(join(tmpdir(), 'ux-sentinel-'));
for (const f of fixtures) {
  // 契约依赖待冻结 → 默认不执行，直接记 NOT_RUN（设计口径：冻结前不可判 FAIL）
  if (isFrozen(f) && !RUN_FROZEN) {
    const id = gate.byFixture.get(f)?.id || '?';
    summary.push({ file: f, code: null, sawFinish: null, status: 'NOT_RUN', frozen: true, id });
    console.log(`\n>>> ${f} [${id}] SKIPPED (NOT_RUN: 契约依赖待冻结，未执行)  ===\n`);
    continue;
  }
  const isoHome = mkdtempSync(join(tmpdir(), 'ux-home-'));
  // 哨兵：夹具走到 finish/blocked 才会写入 → 用于区分「需求未实现」与「夹具自身崩溃」
  const sentinel = join(sentinelDir, `${f}.done`);
  const args = [join(__dirname, f), hdkSrc];
  if (EVID) args.push('--evid', EVID);
  const env = {
    ...process.env,
    HOME: isoHome,
    USERPROFILE: isoHome,
    HUAWEICLOUD_HOME: isoHome,
    UX_FIXTURE_FILE: f, // 供 ux-common.mjs 写入 result.json 时标注来源文件
    UX_SENTINEL: sentinel,
  };
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, args, { stdio: ['inherit', 'inherit', 'inherit'], env });
    p.on('close', resolve);
  });
  rmSync(isoHome, { recursive: true, force: true });
  const sawFinish = existsSync(sentinel);
  const frozen = isFrozen(f);
  // 契约待冻结但照跑了（--run-frozen）：状态仍为 NOT_RUN，不参与 PASS/FAIL/BLOCKED 计数
  const status = frozen ? 'NOT_RUN' : code === 0 ? 'PASS' : code === 2 ? 'BLOCKED' : sawFinish ? 'NOT_IMPLEMENTED' : 'HARNESS_ERROR';
  summary.push({ file: f, code, sawFinish, status, frozen, id: gate.byFixture.get(f)?.id || '' });
  const crash = code !== 0 && code !== 2 && !sawFinish;
  console.log(`\n>>> ${f} exit=${code}${crash ? '  [HARNESS_ERROR] 夹具未走到收尾（自身崩溃，非需求缺口）' : ''}${frozen ? '  [NOT_RUN] 契约依赖待冻结（--run-frozen 趋势观察，不计入 PASS/FAIL/BLOCKED）' : ''}  ===\n`);
}
rmSync(sentinelDir, { recursive: true, force: true });

console.log('===== UX 体验用例（D11）汇总 =====');
let pass = 0, notImpl = 0, blocked = 0, harnessErr = 0, notRun = 0;
for (const s of summary) {
  let tag;
  if (s.status === 'NOT_RUN') { tag = 'NOT_RUN'; notRun += 1; }
  else if (s.code === 0) { tag = 'PASS'; pass += 1; }
  else if (s.code === 2) { tag = 'BLOCKED(ENV)'; blocked += 1; }
  else if (!s.sawFinish) { tag = 'HARNESS_ERROR'; harnessErr += 1; }
  else { tag = 'NOT_IMPLEMENTED'; notImpl += 1; }
  console.log(`${tag.padEnd(16)} ${s.file}${s.code === null ? ' (未执行)' : ` (exit=${s.code})`}`);
}
console.log(`\n总计: pass=${pass} not_implemented=${notImpl} blocked=${blocked} not_run=${notRun} harness_error=${harnessErr} / 共 ${fixtures.length}`);
console.log('口径: NOT_IMPLEMENTED = 需求验收未达标（已知缺口，非 harness 故障）；BLOCKED = 宿主/环境不满足；NOT_RUN = 契约依赖待冻结（冻结前不可判 FAIL，不计入 PASS/FAIL/BLOCKED）；HARNESS_ERROR = 夹具自身崩溃，结果不可判定');
const exitCode = harnessErr > 0 ? 2 : notImpl > 0 ? 1 : blocked > 0 ? 2 : 0;
console.log(`RESULT: ${exitCode === 0 ? 'PASS' : harnessErr > 0 ? 'HARNESS_ERROR' : exitCode === 2 ? 'BLOCKED' : 'NOT_IMPLEMENTED'}${notRun > 0 ? `（另有 ${notRun} 条 NOT_RUN 未计入）` : ''}`);

if (JSON_OUT) {
  const byFile = new Map();
  if (EVID && existsSync(EVID)) {
    for (const dir of readdirSync(EVID)) {
      const p = join(EVID, dir, 'result.json');
      if (!existsSync(p)) continue;
      try {
        const r = JSON.parse(readFileSync(p, 'utf8'));
        if (r.file) byFile.set(r.file, r);
      } catch (e) {
        console.error(`[UX] 跳过无法解析的结果 sidecar: ${p}（${e.message}）`);
      }
    }
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    hdkSrc,
    hdkTag,
    designGate: {
      available: gate.available,
      source: gate.source,
      runFrozen: RUN_FROZEN,
      frozenCount: gate.frozenIds.length,
      frozenIds: gate.frozenIds,
      skippedByGate: RUN_FROZEN ? 0 : frozenFiles.length,
    },
    fixtures: summary.map((s) => ({
      file: s.file,
      case: s.id || null,
      exit: s.code,
      status: s.status,
      frozen: s.frozen,
      note: s.frozen ? '契约依赖待冻结（依赖字段未冻结，冻结前不计入 PASS/FAIL/BLOCKED）' : '',
      harnessError: s.status === 'HARNESS_ERROR',
      result: byFile.get(s.file) || null,
    })),
    summary: {
      pass,
      not_implemented: notImpl,
      blocked,
      not_run: notRun,
      harness_error: harnessErr,
      total: fixtures.length,
      exit: exitCode,
    },
  };
  writeFileSync(JSON_OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`[UX] 结构化结果已写出: ${JSON_OUT}`);
}

if (TMP_EVID) rmSync(EVID, { recursive: true, force: true });
process.exit(exitCode);