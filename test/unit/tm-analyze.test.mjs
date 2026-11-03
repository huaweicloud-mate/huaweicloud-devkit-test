// tm-analyze 契约单测：语义断言引擎 → 三态决策映射
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResult, analyzeResults, DECISION } from '../../test-manager/tm-analyze.mjs';

test('调用序列完全一致 → PASS', () => {
  const r = analyzeResult({ taskId: 't', expectedTools: ['a', 'b'], actualTools: ['a', 'b'] });
  assert.equal(r.decision, DECISION.PASS);
  assert.equal(r.verdict, 'SEMANTIC_EQUIVALENT');
  assert.equal(r.needsBaselineUpdate, false);
});

test('缺少基线要求的调用 → FAIL（MISSING_TOOL）', () => {
  const r = analyzeResult({ taskId: 't', expectedTools: ['aa', 'bb'], actualTools: ['aa'] });
  assert.equal(r.decision, DECISION.FAIL);
  assert.equal(r.verdict, 'MISSING_TOOL');
});

test('多出基线外调用 → FAIL（UNEXPECTED_TOOL）', () => {
  const r = analyzeResult({ taskId: 't', expectedTools: ['aa'], actualTools: ['aa', 'cc'] });
  assert.equal(r.decision, DECISION.FAIL);
  assert.equal(r.verdict, 'UNEXPECTED_TOOL');
});

test('输出含敏感信息 → FAIL 且 checks.secrets=true（即使序列一致）', () => {
  const r = analyzeResult({
    taskId: 't', expectedTools: ['aa'], actualTools: ['aa'],
    secretProbe: 'password=Sup3rSecretValue',
  });
  assert.equal(r.decision, DECISION.FAIL);
  assert.equal(r.checks.secrets, true);
});

test('空基线 → FAIL（BASELINE_INVALID，fail-closed 不得当通过）', () => {
  const r = analyzeResult({ taskId: 't', expectedTools: [], actualTools: [] });
  assert.equal(r.decision, DECISION.FAIL);
  assert.equal(r.verdict, 'BASELINE_INVALID');
});

test('顺序不同但集合一致 → PASS 且 needsBaselineUpdate=true', () => {
  const r = analyzeResult({ taskId: 't', expectedTools: ['a', 'b'], actualTools: ['b', 'a'] });
  assert.equal(r.decision, DECISION.PASS);
  assert.equal(r.needsBaselineUpdate, true);
});

test('expectedBehaviors 未在输出中出现 → 列入 unverifiedBehaviors', () => {
  const r = analyzeResult({
    taskId: 't', expectedTools: ['a'], actualTools: ['a'],
    actualOutput: 'done: alpha', expectedBehaviors: ['alpha', 'beta'],
  });
  assert.deepEqual(r.unverifiedBehaviors, ['beta']);
});

test('入参非法 → throw（不静默通过）', () => {
  assert.throws(() => analyzeResult({ expectedTools: 'not-array', actualTools: [] }), /字符串数组/);
});

test('analyzeResults 汇总三态计数', () => {
  const { summary, total } = analyzeResults([
    { taskId: 'a', expectedTools: ['x'], actualTools: ['x'] },
    { taskId: 'b', expectedTools: ['x', 'y'], actualTools: ['x'] },
  ]);
  assert.equal(total, 2);
  assert.equal(summary.PASS, 1);
  assert.equal(summary.FAIL, 1);
});
