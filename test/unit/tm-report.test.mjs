// tm-report 契约单测：结构化报告生成
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../../test-manager/tm-report.mjs';

const TASKS = [
  { taskId: 'a', decision: 'PASS', verdict: 'SEMANTIC_EQUIVALENT' },
  { taskId: 'b', decision: 'FAIL', verdict: 'SECRET_LEAK', reasons: ['输出含敏感信息'] },
  { taskId: 'c', decision: 'NEED_REVIEW', verdict: 'ORDER_CHANGE', reasons: ['顺序变化'] },
];

test('汇总计数正确', () => {
  const r = generateReport({ runId: 'r1', version: 'v1', tasks: TASKS });
  assert.equal(r.summary.PASS, 1);
  assert.equal(r.summary.FAIL, 1);
  assert.equal(r.summary.NEED_REVIEW, 1);
  assert.equal(r.total, 3);
});

test('markdown 含汇总/明细/失败详情/需复核', () => {
  const { markdown } = generateReport({ runId: 'r1', version: 'v1', tasks: TASKS });
  assert.match(markdown, /## 一、结果汇总/);
  assert.match(markdown, /## 二、明细/);
  assert.match(markdown, /## 三、失败详情/);
  assert.match(markdown, /## 四、需人工复核/);
});

test('SECRET_LEAK → 建议按安全回归处理', () => {
  const { markdown } = generateReport({ tasks: TASKS });
  assert.match(markdown, /安全回归/);
});

test('needsBaselineUpdate → 建议更新基线', () => {
  const { markdown } = generateReport({
    tasks: [{ taskId: 'a', decision: 'PASS', verdict: 'MINOR_FORMAT_CHANGE', needsBaselineUpdate: true }],
  });
  assert.match(markdown, /更新基线/);
});

test('未标注 decision 计入 UNKNOWN（不误算成 PASS）', () => {
  const r = generateReport({ tasks: [{ taskId: 'a' }] });
  assert.equal(r.summary.UNKNOWN, 1);
  assert.equal(r.summary.PASS, 0);
});

test('tasks 非数组 → throw', () => {
  assert.throws(() => generateReport({ tasks: 'nope' }), /数组/);
});
