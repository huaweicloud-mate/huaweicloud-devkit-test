// ux-replay.mjs — D11-39 体验回放差异分类（范式②：基线 + 语义分类）
//
// 链路: 场景定义（本文件 SCENARIOS，规则唯一真源）
//       → spawn 对应 D11 夹具（隔离宿主）→ 读夹具 sidecar result.json 的断言 actual 拼成「用户可见文案」
//       → compare.mjs::classifyUxText 语义分类 → 落趋势 CSV + 结构化汇总。
//
// 录制（版本化基线）:
//   node eval/replay/ux-replay.mjs <hdk src> --record     # 采集当前 SUT 文案 → recordings/ux-baseline-v1.jsonl
// 回放（默认）:
//   node eval/replay/ux-replay.mjs <hdk src> [--recording <jsonl>] [--outdir <dir>] [--json <path>]
//
// 口径：
//   - PASS 类沿用既有三态（SEMANTIC_EQUIVALENT / MINOR_FORMAT_CHANGE）——「文案与基线语义等价/仅格式微差」；
//   - 4 类 FAIL = 体验退化（MISLEADING_HINT / INTERNAL_JARGON_LEAK / ENGLISH_RESIDUE / UNCLEAR_NEXT_STEP）；
//   - 夹具 BLOCKED（exit 2，如沙箱场景无环境）→ 记 BLOCKED，不计入通过率、不影响退出码；
//   - 夹具崩溃/无 sidecar → 记 HARNESS_ERROR（不计入文案退化），退出码走「不可判定」。
//   退出码: 0 全 PASS / 1 存在体验退化 / 2 不可判定（harness 错误或全部场景 BLOCKED）
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyUxText, containsSecret, isUxPass } from './compare.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const FIXTURE_DIR = join(REPO_ROOT, 'eval', 'harness', 'fixtures');
const DEFAULT_RECORDING = join(__dirname, 'recordings', 'ux-baseline-v1.jsonl');

// ---- 场景定义（规则唯一真源；基线 jsonl 只存文案快照，规则改动在这里）----
const SCENARIOS = [
  {
    id: 'UX-NOLOGIN',
    title: '未登录首触引导文案',
    case: 'D11-1',
    fixture: 'd11-1-onboarding-first-touch.mjs',
    rules: {
      requireAction: true,
      requiredKeywords: [/凭证|AK\/SK/],
      misleadingPatterns: [/连接成功/, /凭证有效/, /一切正常/],
    },
  },
  {
    id: 'UX-IAM401',
    title: 'IAM 401 凭据错误文案',
    case: 'D11-12',
    fixture: 'd11-12-iam401-zh.mjs',
    rules: {
      requireAction: true,
      requiredKeywords: [/AK|SK|凭证|权限|鉴权/],
      misleadingPatterns: [/连接成功/, /网络异常/, /服务器错误/],
    },
  },
  {
    id: 'UX-CONFLICT',
    title: '双来源凭据冲突文案',
    case: 'D11-6',
    fixture: 'd11-6-conflict-dual-source.mjs',
    rules: {
      requireAction: true,
      requiredKeywords: [/冲突|同时|两份|两套|多个来源|优先级|选择其一/],
    },
  },
  {
    id: 'UX-TERMINOLOGY',
    title: '工具描述人话化（内部代号 / 英文残留）',
    case: 'D11-26',
    fixture: 'd11-26-terminology.mjs',
    rules: { requireAction: false },
  },
  {
    id: 'UX-SANDBOX-FAIL',
    title: '沙箱连不通排障文案（环境门控）',
    case: 'D11-35',
    fixture: 'd11-35-sandbox-unreachable-guide.mjs',
    rules: {
      requireAction: true,
      requiredKeywords: [/沙箱|隧道|nginx|devbridge/i],
    },
  },
];

const argv = process.argv.slice(2);
const argOf = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
};
const RECORD = argv.includes('--record');
const JSON_OUT = argOf('--json');
const recordingPath = argOf('--recording') || DEFAULT_RECORDING;
const outDir = argOf('--outdir') || join(__dirname, 'results');
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--recording' && argv[i - 1] !== '--outdir' && argv[i - 1] !== '--json');
let hdkSrc = positional[0];
if (!hdkSrc) {
  const srcOf = (root) => join(root, 'plugins', 'huaweicloud-core', 'src');
  const cands = [process.env.HUAWEICLOUD_DEVKIT_HOME, process.env.HDK_PATH, join(REPO_ROOT, '..', 'hdk')];
  hdkSrc = cands.filter(Boolean).map(srcOf).find((p) => existsSync(join(p, 'tools.mjs'))) || null;
}
if (!hdkSrc || !existsSync(join(hdkSrc, 'tools.mjs'))) {
  console.error('无法定位 hdk src：传 <hdk src>（plugins/huaweicloud-core/src）或设 HUAWEICLOUD_DEVKIT_HOME / HDK_PATH');
  process.exit(2);
}

const detectVersion = () => {
  for (const rel of ['../../../package.json', '../../package.json']) {
    const p = join(hdkSrc, rel);
    if (!existsSync(p)) continue;
    try {
      const v = JSON.parse(readFileSync(p, 'utf8')).version;
      if (v) return v;
    } catch {
      /* ignore */
    }
  }
  return '';
};

function loadBaseline(path) {
  if (!existsSync(path)) return new Map();
  const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      if (rec.id) map.set(rec.id, rec);
    } catch {
      /* 跳过坏行 */
    }
  }
  return map;
}

// 跑一个场景夹具（隔离宿主），返回 { text, exit, sidecar }
async function runScenario(scenario, evidDir) {
  const fixturePath = join(FIXTURE_DIR, scenario.fixture);
  if (!existsSync(fixturePath)) return { text: '', exit: 2, sidecar: null, reason: `夹具不存在: ${scenario.fixture}` };
  const isoHome = mkdtempSync(join(tmpdir(), 'ux-replay-home-'));
  const sentinel = join(evidDir, `${scenario.id}.done`);
  const env = {
    ...process.env,
    HOME: isoHome,
    USERPROFILE: isoHome,
    HUAWEICLOUD_HOME: isoHome,
    UX_FIXTURE_FILE: scenario.fixture,
    UX_SENTINEL: sentinel,
  };
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [fixturePath, hdkSrc, '--evid', evidDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.stderr.on('data', (d) => { out += d.toString(); });
    p.on('close', resolve);
  });
  rmSync(isoHome, { recursive: true, force: true });

  const sidecarPath = join(evidDir, scenario.case, 'result.json');
  let sidecar = null;
  if (existsSync(sidecarPath)) {
    try {
      sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8'));
    } catch {
      sidecar = null;
    }
  }
  const text = sidecar
    ? (sidecar.assertions || []).map((a) => JSON.stringify(a.actual)).join('\n')
    : '';
  const sawFinish = existsSync(sentinel);
  let state = 'OK';
  if (code === 2) state = 'BLOCKED';
  else if (!sidecar || !sawFinish) state = 'HARNESS_ERROR';
  return { text, exit: code, sidecar, state };
}

const baseline = loadBaseline(recordingPath);
const version = detectVersion();
console.log(`[UX回放] hdk src = ${hdkSrc}${version ? ` (v${version})` : ''}`);
console.log(`[UX回放] 模式 = ${RECORD ? '录制（写入基线）' : '回放（对照基线）'} | 基线 = ${recordingPath}`);
console.log(`[UX回放] 场景 ${SCENARIOS.length} 个: ${SCENARIOS.map((s) => s.id).join(', ')}\n`);

const evidDir = mkdtempSync(join(tmpdir(), 'ux-replay-evid-'));
const rows = [];
const recordedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

for (const sc of SCENARIOS) {
  process.stdout.write(`${sc.id} (${sc.case}) … `);
  const { text, exit: fxExit, state } = await runScenario(sc, evidDir);
  const base = baseline.get(sc.id);
  let verdict;
  let reasons = [];
  if (state === 'BLOCKED') {
    verdict = 'BLOCKED';
    reasons = ['夹具判环境不可判定（exit 2）—— 不计入通过率'];
  } else if (state === 'HARNESS_ERROR') {
    verdict = 'HARNESS_ERROR';
    reasons = [`夹具未产出 sidecar（exit=${fxExit}）`];
  } else if (!base) {
    verdict = RECORD ? 'RECORDED' : 'BASELINE_INVALID';
    reasons = [RECORD ? '本次采集写入基线' : '基线中无该场景（先 --record 录制）'];
  } else {
    const res = classifyUxText(text, { ...sc.rules, baselineText: base.baselineText });
    verdict = res.verdict;
    reasons = res.reasons;
  }
  const pass = isUxPass(verdict);
  console.log(`${verdict}${pass ? '' : ' | ' + reasons.join('; ')}`);
  rows.push({
    id: sc.id,
    case: sc.case,
    title: sc.title,
    verdict,
    pass,
    reasons: reasons.join('; '),
    fixtureExit: fxExit,
    state,
    text,
    baselineText: base ? base.baselineText : null,
  });
}

rmSync(evidDir, { recursive: true, force: true });

// ---- 录制：写版本化基线（只写 baselineText + 溯源，规则留在 SCENARIOS）----
if (RECORD) {
  // 安全守卫：基线会进版本库 —— 文案含疑似敏感信息（AK/SK/token/password）时拒绝写入（fail-closed）
  const tainted = rows.filter((r) => r.state === 'OK' && containsSecret(r.text));
  if (tainted.length) {
    console.error(`\n[UX回放] 拒绝写基线：以下场景文案含疑似敏感信息 → ${tainted.map((r) => r.id).join(', ')}`);
    process.exit(2);
  }
  mkdirSync(dirname(recordingPath), { recursive: true });
  const lines = rows
    .filter((r) => r.state === 'OK')
    .map((r) =>
      JSON.stringify({
        id: r.id,
        case: r.case,
        title: r.title,
        sutVersion: version,
        recordedAt,
        fixture: SCENARIOS.find((s) => s.id === r.id).fixture,
        baselineText: r.text,
      }),
    );
  writeFileSync(recordingPath, `${lines.join('\n')}\n`, 'utf-8');
  console.log(`\n[UX回放] 基线已写出：${recordingPath}（${lines.length} 条；BLOCKED/HARNESS_ERROR 场景不入基线）`);
}

// ---- 判定与落盘 ----
const judged = rows.filter((r) => r.state === 'OK' && r.verdict !== 'RECORDED');
const passN = judged.filter((r) => r.pass).length;
const failN = judged.length - passN;
const blockedN = rows.filter((r) => r.verdict === 'BLOCKED').length;
const harnessN = rows.filter((r) => r.verdict === 'HARNESS_ERROR').length;
const exitCode = harnessN > 0 ? 2 : RECORD ? 0 : judged.length === 0 && blockedN > 0 ? 2 : failN > 0 ? 1 : 0;

console.log('\n=== 体验回放汇总（范式②） ===');
console.log(
  `通过=${passN} 体验退化=${failN} BLOCKED=${blockedN} HARNESS_ERROR=${harnessN} / 总=${rows.length}` +
    ` | 通过率=${judged.length ? ((passN / judged.length) * 100).toFixed(1) : '—'}%`,
);
const byVerdict = {};
for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
console.log(`分类分布: ${Object.entries(byVerdict).map(([k, v]) => `${k}=${v}`).join(' ')}`);
console.log(`RESULT: ${exitCode === 0 ? 'PASS' : exitCode === 2 ? 'INDETERMINATE' : 'UX_REGRESSION'}`);

mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const outPath = join(outDir, `ux-replay-${ts}.csv`);
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const csv = ['id,case,title,verdict,pass,reasons,fixture_exit,state']
  .concat(rows.map((r) => [r.id, r.case, r.title, r.verdict, r.pass, r.reasons, r.fixtureExit, r.state].map(esc).join(',')))
  .join('\n');
writeFileSync(outPath, `${csv}\n`, 'utf-8');
console.log(`结果落盘: ${outPath}`);

if (JSON_OUT) {
  const payload = {
    generatedAt: recordedAt,
    sutVersion: version,
    hdkSrc,
    mode: RECORD ? 'record' : 'replay',
    recording: recordingPath,
    summary: { pass: passN, ux_regression: failN, blocked: blockedN, harness_error: harnessN, total: rows.length, exit: exitCode },
    byVerdict,
    scenarios: rows.map(({ text, baselineText, ...rest }) => rest), // 正文可能含长文案，结构化输出只保留判定
  };
  writeFileSync(JSON_OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  console.log(`结构化结果已写出: ${JSON_OUT}`);
}

if (!RECORD && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });
process.exit(exitCode);