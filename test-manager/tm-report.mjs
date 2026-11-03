// tm-report.mjs — 结构化测试报告生成器
//
// 对齐 docs/test-ai-orchestration-architecture.md §五 Step 5「tm_generate_report」：
//  输入 = runId + 各任务结果；输出 = 汇总 + 失败详情 + 需复核 + 建议（markdown）。
//
// 纯函数、无 IO。不注入时间戳（跨日比对该忽略时间字段；需要时间时由调用方传入）。

const DECISIONS = ['PASS', 'FAIL', 'NEED_REVIEW'];

function line(cells) {
  return `| ${cells.join(' | ')} |`;
}

/**
 * @param {object} p
 * @param {string} [p.runId]
 * @param {string} [p.version]
 * @param {Array<{taskId?:string, decision?:string, verdict?:string, reasons?:string[]}>} [p.tasks]
 * @param {string} [p.startedAt] 由调用方给的展示时间（引擎不自造时间）
 * @param {string} [p.finishedAt]
 */
export function generateReport({
  runId = '',
  version = 'unspecified',
  tasks = [],
  startedAt = '',
  finishedAt = '',
  notes = [],
} = {}) {
  if (!Array.isArray(tasks)) throw new Error('tasks 必须是数组');

  const summary = { PASS: 0, FAIL: 0, NEED_REVIEW: 0, UNKNOWN: 0 };
  for (const t of tasks) {
    const d = DECISIONS.includes(t?.decision) ? t.decision : 'UNKNOWN';
    summary[d] += 1;
  }

  const fails = tasks.filter((t) => t?.decision === 'FAIL');
  const reviews = tasks.filter((t) => t?.decision === 'NEED_REVIEW');

  const out = [];
  out.push(`# 测试报告${runId ? ` · ${runId}` : ''}`);
  out.push('');
  out.push(`- 被测版本：**${version}**`);
  if (startedAt || finishedAt) out.push(`- 时间：${startedAt || '?'} → ${finishedAt || '?'}`);
  out.push(`- 生成者：AI Test Manager（tm_generate_report）`);
  out.push('');
  out.push('## 一、结果汇总');
  out.push('');
  out.push(line(['决策', '数量']));
  out.push(line(['---', '---']));
  out.push(line(['PASS', String(summary.PASS)]));
  out.push(line(['FAIL', String(summary.FAIL)]));
  out.push(line(['NEED_REVIEW', String(summary.NEED_REVIEW)]));
  if (summary.UNKNOWN) out.push(line(['未标注', String(summary.UNKNOWN)]));
  out.push(line(['**合计**', `**${tasks.length}**`]));
  out.push('');

  out.push('## 二、明细');
  out.push('');
  out.push(line(['任务', '决策', '差异分类', '说明']));
  out.push(line(['---', '---', '---', '---']));
  for (const t of tasks) {
    const reasons = Array.isArray(t?.reasons) ? t.reasons.join('；') : '';
    out.push(line([t?.taskId || '-', t?.decision || 'UNKNOWN', t?.verdict || '-', reasons || '-']));
  }
  out.push('');

  if (fails.length) {
    out.push('## 三、失败详情');
    out.push('');
    for (const t of fails) {
      out.push(`- **${t.taskId || '-'}**（${t.verdict || '?'}）：${(t.reasons || []).join('；') || '未给原因'}`);
      if (t.rootcause) out.push(`  - 根因：${t.rootcause}`);
    }
    out.push('');
  }

  if (reviews.length) {
    out.push('## 四、需人工复核');
    out.push('');
    for (const t of reviews) {
      out.push(`- ${t.taskId || '-'}（${t.verdict || '?'}）：${(t.reasons || []).join('；') || '需人判'}`);
    }
    out.push('');
  }

  const suggestions = [];
  if (fails.some((t) => t.verdict === 'SECRET_LEAK')) {
    suggestions.push('存在敏感信息泄漏（SECRET_LEAK）→ 按安全回归处理，阻断并立即排查脱敏链路。');
  }
  if (fails.some((t) => t.verdict === 'BASELINE_INVALID')) {
    suggestions.push('存在基线不合法（BASELINE_INVALID）→ 先补齐录制基线，再重跑（fail-closed，不得当通过）。');
  }
  if (tasks.some((t) => t.needsBaselineUpdate)) {
    suggestions.push('有任务属格式微变/顺序变化 → 人工确认后更新基线（tm_update_baseline）。');
  }
  if (notes.length) for (const n of notes) suggestions.push(String(n));
  if (suggestions.length) {
    out.push('## 五、建议');
    out.push('');
    for (const s of suggestions) out.push(`- ${s}`);
    out.push('');
  }

  return { runId, version, summary, total: tasks.length, markdown: out.join('\n') };
}
