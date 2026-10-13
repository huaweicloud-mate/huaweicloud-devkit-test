// Layer 2 契约单测：eval/replay/compare.mjs 语义差异分类器
// 覆盖 test-panorama-plan §6.4 全部分类：语义等价/顺序变化/缺调用/多出调用/敏感泄漏/基线非法。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare, containsSecret, VERDICT, isPass } from '../../eval/replay/compare.mjs';

test('完全一致的序列 → SEMANTIC_EQUIVALENT', () => {
  const r = compare({ expectedTools: ['list_regions', 'run_readonly_command'], actualTools: ['list_regions', 'run_readonly_command'] });
  assert.equal(r.verdict, VERDICT.SEMANTIC_EQUIVALENT);
  assert.ok(isPass(r.verdict));
});

test('集合一致但顺序不同 → ORDER_CHANGE（可容忍，非 FAIL）', () => {
  const r = compare({ expectedTools: ['list_regions', 'run_readonly_command'], actualTools: ['run_readonly_command', 'list_regions'] });
  assert.equal(r.verdict, VERDICT.ORDER_CHANGE);
  assert.ok(isPass(r.verdict));
});

test('缺失必要调用 → MISSING_TOOL（FAIL）', () => {
  const r = compare({
    expectedTools: ['detect_framework', 'sandbox_connect', 'deploy_nginx'],
    actualTools: ['detect_framework', 'deploy_nginx'],
  });
  assert.equal(r.verdict, VERDICT.MISSING_TOOL);
  assert.ok(!isPass(r.verdict));
  assert.ok(r.reasons.some((x) => x.includes('sandbox_connect')));
});

test('实际多出基线外调用 → UNEXPECTED_TOOL（FAIL）', () => {
  const r = compare({
    expectedTools: ['search_docs'],
    actualTools: ['search_docs', 'hcloud ECS CreateServer'],
  });
  assert.equal(r.verdict, VERDICT.UNEXPECTED_TOOL);
  assert.ok(!isPass(r.verdict));
});

test('安全回归：输出含敏感信息 → SECRET_LEAK（FAIL，优先级高于集合匹配）', () => {
  const r = compare({
    expectedTools: ['show_profile_redacted'],
    actualTools: ['show_profile_redacted'],
    options: { secretProbe: JSON.stringify({ access_key: 'AKIA123' }) },
  });
  assert.equal(r.verdict, VERDICT.SECRET_LEAK);
  assert.ok(!isPass(r.verdict));
});

test('基线为空 → BASELINE_INVALID（fail-closed）', () => {
  assert.equal(compare({ expectedTools: [], actualTools: ['x'] }).verdict, VERDICT.BASELINE_INVALID);
  assert.equal(compare({ expectedTools: [], actualTools: [] }).verdict, VERDICT.BASELINE_INVALID);
});

test('实际序列为空但基线非空 → BASELINE_INVALID', () => {
  const r = compare({ expectedTools: ['a', 'b'], actualTools: [] });
  assert.equal(r.verdict, VERDICT.BASELINE_INVALID);
  assert.ok(!isPass(r.verdict));
});

test('containsSecret: 识别对象/字符串/嵌套敏感值', () => {
  assert.ok(containsSecret('password=hunter2'));
  assert.ok(containsSecret('AKIA1234'));
  assert.ok(containsSecret(JSON.stringify({ creds: { access_key: 'x' } })));
  assert.ok(containsSecret('hcloud --adminPass=secret'));
  assert.ok(!containsSecret('hello world 普通文本'));
  assert.ok(!containsSecret(JSON.stringify({ name: 'demo', region: 'cn-north-4' })));
});

test('isPass: 仅语义等价/格式变化/顺序变化算通过', () => {
  assert.ok(isPass('SEMANTIC_EQUIVALENT'));
  assert.ok(isPass('MINOR_FORMAT_CHANGE'));
  assert.ok(isPass('ORDER_CHANGE'));
  assert.ok(!isPass('MISSING_TOOL'));
  assert.ok(!isPass('SECRET_LEAK'));
  assert.ok(!isPass('BASELINE_INVALID'));
});