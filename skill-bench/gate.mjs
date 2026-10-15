// gate.mjs — skill-bench 门禁：读入库的脱敏 run 记录（results/runs/*.json）做口径 + 阈值断言
// 说明：门禁是「离线口径门禁」——只校验已入库数据（数据完整性 / 版本锚点 / 成功率 / 指标不退化），
//      不真机复跑（CI runner 无云凭证、无评测机资源）。真机跑批仍是本地/评测机侧动作。
// 用法: node skill-bench/gate.mjs            （exit 0 = 通过 / 1 = 门禁失败）
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, 'results', 'runs');
const CFG = JSON.parse(readFileSync(join(HERE, 'gate.config.json'), 'utf-8'));
const TASKS = JSON.parse(readFileSync(join(HERE, 'tasks', 'tasks.json'), 'utf-8'));

function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function loadRuns() {
  if (!existsSync(RUNS_DIR)) return { runs: [], errors: [`未找到 run 记录目录 ${RUNS_DIR}`] };
  const errors = [];
  const runs = [];
  for (const f of readdirSync(RUNS_DIR).filter((x) => x.endsWith('.json')).sort()) {
    try {
      runs.push({ ...JSON.parse(readFileSync(join(RUNS_DIR, f), 'utf-8')), _file: f });
    } catch (e) {
      errors.push(`${f} 解析失败: ${e.message}`);
    }
  }
  return { runs, errors };
}

const { runs, errors } = loadRuns();
const failures = [...errors];
const notes = [];

if (!runs.length) {
  // 尚未建立基线时（无 gate.baseline.json）：视为「门禁未开始」→ SKIP 而非 FAIL；
  // 已建立基线后记录消失 → 判 FAIL（数据丢失）。
  const baselineExists = existsSync(join(HERE, 'gate.baseline.json'));
  if (!baselineExists) {
    console.log('[gate] SKIP：仓库尚无入库 run 记录，且尚未建立 gate.baseline.json → 门禁不可判定（不判 FAIL）');
    console.log('[gate] 说明：真机跑批后 results/runs/*.json 入库，本门禁即开始生效；建基线后记录为空将直接判 FAIL。');
    process.exit(0);
  }
  console.error('[gate] 已建立基线但未找到任何 run 记录（results/runs/*.json）→ 数据丢失，判 FAIL');
  process.exit(1);
}

// ---- 按任务聚合 ----
const byTask = new Map();
for (const r of runs) {
  if (!byTask.has(r.taskId)) byTask.set(r.taskId, []);
  byTask.get(r.taskId).push(r);
}
const taskIds = [...byTask.keys()].sort();
const knownTaskIds = new Set(TASKS.map((t) => t.id));

console.log(`[gate] 记录 ${runs.length} 条 / 任务 ${taskIds.length} 个 / 配置 minRuns=${CFG.minRunsPerTask} minPassRate=${CFG.minPassRate}`);
console.log('');
console.log('任务'.padEnd(26) + '采样'.padStart(4) + 'PASS'.padStart(6) + '成功率'.padStart(8) +
  'token中位'.padStart(11) + 'step中位'.padStart(9) + '  判定');
console.log('-'.repeat(86));

const regression = [];
for (const id of taskIds) {
  const rs = byTask.get(id);
  const passes = rs.filter((r) => r.verdict === 'PASS').length;
  const rate = passes / rs.length;
  const tk = median(rs.map((r) => r.totalTokens || 0));
  const st = median(rs.map((r) => r.stepCount || 0));
  const exempt = (CFG.knownFailures || []).includes(id);
  const problems = [];

  if (!knownTaskIds.has(id)) problems.push('任务已不在 tasks.json');
  if (rs.length < CFG.minRunsPerTask) problems.push(`采样不足(${rs.length}<${CFG.minRunsPerTask})`);
  if (CFG.requireVersionAnchor) {
    const bad = rs.filter((r) => !r.devkitVersion || r.devkitVersion === 'unknown');
    if (bad.length) problems.push(`缺版本锚点(${bad.length} 条)`);
  }
  if (!exempt && rate < CFG.minPassRate) problems.push(`成功率 ${(rate * 100).toFixed(0)}% < ${(CFG.minPassRate * 100).toFixed(0)}%`);
  if (exempt && rate >= CFG.minPassRate) notes.push(`${id} 已在 knownFailures 豁免名单，但本次已达标（可从名单移除）`);

  const verdictTxt = problems.length ? '✗ ' + problems.join('; ') : (exempt ? '✓ (豁免)' : '✓');
  if (problems.length) failures.push(`${id}: ${problems.join('; ')}`);
  regression.push({ id, tk, st });
  console.log(id.padEnd(26) + String(rs.length).padStart(4) + String(passes).padStart(6) +
    `${(rate * 100).toFixed(0)}%`.padStart(8) + String(tk).padStart(11) + String(st).padStart(9) + '  ' + verdictTxt);
}

// ---- 指标不退化（有 gate.baseline.json 时才比对，否则显式跳过）----
const baselinePath = join(HERE, 'gate.baseline.json');
if (CFG.regression && CFG.regression.enabled && existsSync(baselinePath)) {
  const base = JSON.parse(readFileSync(baselinePath, 'utf-8'));
  console.log('');
  console.log(`[gate] 指标对照基线 gate.baseline.json（token 容忍 +${(CFG.regression.maxTokenIncreaseRatio * 100).toFixed(0)}% / step 容忍 +${CFG.regression.maxStepIncrease}）`);
  for (const cur of regression) {
    const b = base[cur.id];
    if (!b) { notes.push(`${cur.id} 基线中无记录，跳过对照`); continue; }
    const tkLimit = b.medianTokens * (1 + CFG.regression.maxTokenIncreaseRatio);
    const stLimit = b.medianSteps + CFG.regression.maxStepIncrease;
    const bad = [];
    if (cur.tk > tkLimit) bad.push(`token ${cur.tk} > ${Math.round(tkLimit)}`);
    if (cur.st > stLimit) bad.push(`step ${cur.st} > ${stLimit}`);
    if (bad.length) {
      failures.push(`${cur.id} 指标退化: ${bad.join(', ')}`);
      console.log(`  ✗ ${cur.id}: ${bad.join(', ')}`);
    } else {
      console.log(`  ✓ ${cur.id}: token ${cur.tk}(基线 ${b.medianTokens}) step ${cur.st}(基线 ${b.medianSteps})`);
    }
  }
} else {
  notes.push('指标退化对照未启用（缺 gate.baseline.json 或配置关闭）→ 本次不做跨版本阈值比对');
}

// ---- 安全指标（待 R4 把放行率写进 run 记录后启用）----
if (CFG.safety && CFG.safety.enabled) {
  const withSafety = runs.filter((r) => r.safety);
  if (!withSafety.length) {
    failures.push('安全指标已启用但 run 记录里没有 safety 字段');
  } else {
    const violations = withSafety.filter((r) => (r.safety.highRiskAllowed || 0) > 0);
    console.log(`\n[gate] 安全指标: ${withSafety.length} 条记录含 safety，高危放行 ${violations.length} 条`);
    if (violations.length) failures.push(`高危放行 ${violations.length} 条（应为 0）: ${violations.map((v) => v.runid).join(', ')}`);
  }
} else {
  notes.push('安全指标未启用（配置 safety.enabled=false）→ 高危放行率未纳入门禁');
}

console.log('');
for (const n of notes) console.log(`[note] ${n}`);
if (failures.length) {
  console.error('\n[gate] FAIL:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('\n[gate] PASS：口径完整、成功率达标、指标无退化');
process.exit(0);
