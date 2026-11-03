// tm-analyze.mjs — 质量分析器（语义断言引擎）
//
// 对齐 docs/test-ai-orchestration-architecture.md §2.4「质量分析器（语义断言引擎）」：
//  输入 = Worker 原始输出 + 期望行为；输出 = decision + evidence。
//
// 复用 eval/replay/compare.mjs 的差异分类（8 类 verdict），把 verdict 映射为编排层三态决策：
//   PASS        verdict ∈ PASS_VERDICTS（等价 / 格式微变 / 顺序变）且无敏感泄漏
//   FAIL        SECRET_LEAK / MISSING_TOOL / UNEXPECTED_TOOL / INTENT_NOT_MET / BASELINE_INVALID
//   NEED_REVIEW 其余（基线不合法之外的未知态、或需要人判的情形）
//
// 纯函数、无 IO（供 MCP 工具 tm_analyze_result 与单测直调）。

import { compare, containsSecret, VERDICT, PASS_VERDICTS } from '../eval/replay/compare.mjs';

export const DECISION = { PASS: 'PASS', FAIL: 'FAIL', NEED_REVIEW: 'NEED_REVIEW' };

const FAIL_VERDICTS = new Set([
  VERDICT.MISSING_TOOL,
  VERDICT.UNEXPECTED_TOOL,
  VERDICT.SECRET_LEAK,
  VERDICT.INTENT_NOT_MET,
  VERDICT.BASELINE_INVALID,
]);

/**
 * 分析单条任务的执行结果。
 * @param {object} p
 * @param {string} [p.taskId]
 * @param {string[]} [p.expectedTools] 基线调用序列
 * @param {string[]} [p.actualTools]   实际调用序列
 * @param {string} [p.secretProbe]     用于敏感扫描的文本（缺省回退 actualOutput）
 * @param {string} [p.actualOutput]
 * @param {string[]} [p.expectedBehaviors] 期望行为描述（用于列出「未验证」项，不参与 pass/fail 判定）
 */
export function analyzeResult({
  taskId = '',
  expectedTools = [],
  actualTools = [],
  secretProbe = '',
  actualOutput = '',
  expectedBehaviors = [],
  options = {},
} = {}) {
  if (!Array.isArray(expectedTools) || !Array.isArray(actualTools)) {
    throw new Error('expectedTools / actualTools 必须是字符串数组');
  }
  if (expectedBehaviors != null && !Array.isArray(expectedBehaviors)) {
    throw new Error('expectedBehaviors 必须是字符串数组');
  }

  const probe = secretProbe || actualOutput || '';
  const secrets = containsSecret(probe);
  const cmp = compare({ expectedTools, actualTools, options: { ...options, secretProbe: probe } });
  const verdict = cmp.verdict;

  let decision;
  if (secrets || FAIL_VERDICTS.has(verdict)) decision = DECISION.FAIL;
  else if (PASS_VERDICTS.has(verdict)) decision = DECISION.PASS;
  else decision = DECISION.NEED_REVIEW;

  // 顺序变化/格式微变 → 结果可用，但基线该更新（compare 的 PASS 类里除完全等价外）
  const needsBaselineUpdate =
    verdict === VERDICT.MINOR_FORMAT_CHANGE || verdict === VERDICT.ORDER_CHANGE;

  const unverifiedBehaviors = (expectedBehaviors || []).filter(
    (b) => !String(probe).includes(String(b)),
  );

  return {
    taskId,
    decision,
    verdict,
    reasons: cmp.reasons,
    needsBaselineUpdate,
    unverifiedBehaviors,
    checks: {
      secrets,
      callSequence: verdict,
      baseline: { expected: cmp.expectedTools, actual: cmp.actualTools },
    },
  };
}

/** 批量分析（供编排器一次调用）。 */
export function analyzeResults(tasks = []) {
  if (!Array.isArray(tasks)) throw new Error('tasks 必须是数组');
  const results = tasks.map((t) => analyzeResult(t));
  const summary = { PASS: 0, FAIL: 0, NEED_REVIEW: 0 };
  for (const r of results) summary[r.decision] += 1;
  return { results, summary, total: results.length };
}
