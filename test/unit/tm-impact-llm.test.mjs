// tm-impact-llm 契约单测：LLM 影响域分析 + 确定性回退（全部用 mock fetch，不真调网络）
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYZER,
  buildImpactPrompt,
  extractFirstJson,
  parseImpactResponse,
  analyzeImpactLLM,
  analyzeImpactAuto,
  rulesImpact,
} from '../../test-manager/tm-impact-llm.mjs';

const SCOPE = { changedFiles: ['plugins/huaweicloud-core/src/safety-policy.mjs'] };

const llmOk = (content) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
});

const SAFE_JSON = '{"dimensions":[{"dim":"D4","risk":"high","reason":"安全策略变更"}],"risk":"high","notes":"n"}';

test('extractFirstJson：取平衡的第一个对象（含前后文字/围栏）', () => {
  assert.equal(extractFirstJson('前缀 ```json\n{"a":{"b":1}}\n``` 后缀'), '{"a":{"b":1}}');
  assert.equal(extractFirstJson('无对象'), null);
  // 字符串里的花括号不破坏平衡
  assert.equal(extractFirstJson('x {"s":"}{"} y'), '{"s":"}{"}');
});

test('parseImpactResponse：合法 → dimensions；非法维度/风险 → null', () => {
  assert.equal(parseImpactResponse(SAFE_JSON).dimensions[0].dim, 'D4');
  assert.equal(parseImpactResponse('{"dimensions":[{"dim":"D99","risk":"high"}]}'), null);
  assert.equal(parseImpactResponse('{"dimensions":[{"dim":"D4","risk":"terrible"}]}'), null);
  assert.equal(parseImpactResponse('{"dimensions":[]}'), null);
  assert.equal(parseImpactResponse('没有 JSON'), null);
});

test('buildImpactPrompt：含维度清单与变更文件', () => {
  const p = buildImpactPrompt({ changedFiles: ['x/y.mjs'] });
  assert.match(p, /D4/);
  assert.match(p, /x\/y\.mjs/);
});

test('analyzeImpactLLM：缺配置 → throw（由 auto 兜底）', async () => {
  await assert.rejects(() => analyzeImpactLLM(SCOPE, { endpoint: '', apiKey: '', fetchImpl: llmOk(SAFE_JSON) }), /缺 LLM 配置/);
});

test('analyzeImpactLLM：正常响应 → source=llm 且维度被校验采纳', async () => {
  const r = await analyzeImpactLLM(SCOPE, {
    endpoint: 'https://x/v1', apiKey: 'k', fetchImpl: llmOk(SAFE_JSON),
  });
  assert.equal(r.source, ANALYZER.LLM);
  assert.equal(r.risk, 'high');
  assert.equal(r.affectedDimensions[0].dim, 'D4');
  assert.equal(r.affectedDimensions[0].label.length > 0, true);
});

test('analyzeImpactLLM：HTTP 500 → throw', async () => {
  await assert.rejects(
    () => analyzeImpactLLM(SCOPE, { endpoint: 'https://x/v1', apiKey: 'k', fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }) }),
    /HTTP 500/,
  );
});

test('analyzeImpactLLM：输出编造维度 → throw（不采信）', async () => {
  await assert.rejects(
    () => analyzeImpactLLM(SCOPE, { endpoint: 'https://x/v1', apiKey: 'k', fetchImpl: llmOk('{"dimensions":[{"dim":"D99","risk":"high"}]}') }),
    /不合法/,
  );
});

test('analyzeImpactAuto：无配置 → 回退 rules 且带 fallbackReason', async () => {
  const r = await analyzeImpactAuto(SCOPE, { analyzer: ANALYZER.AUTO, endpoint: '', apiKey: '' });
  assert.equal(r.source, ANALYZER.RULES);
  assert.match(r.fallbackReason, /缺 LLM 配置/);
  assert.ok(r.affectedDimensions.some((d) => d.dim === 'D4'));
});

test('analyzeImpactAuto：analyzer=rules 时不调用 fetch', async () => {
  let called = false;
  const r = await analyzeImpactAuto(SCOPE, {
    analyzer: ANALYZER.RULES,
    fetchImpl: async () => { called = true; return { ok: true, status: 200, json: async () => ({}) }; },
  });
  assert.equal(called, false);
  assert.equal(r.source, ANALYZER.RULES);
});

test('analyzeImpactAuto：LLM 返回非法 → 回退 rules（流水线不中断）', async () => {
  const r = await analyzeImpactAuto(SCOPE, {
    analyzer: ANALYZER.AUTO, endpoint: 'https://x/v1', apiKey: 'k',
    fetchImpl: llmOk('{"dimensions":[{"dim":"D99","risk":"high"}]}'),
  });
  assert.equal(r.source, ANALYZER.RULES);
  assert.match(r.fallbackReason, /不合法/);
});

test('rulesImpact：等同确定性 analyzeImpact（D4/high）', () => {
  const r = rulesImpact(SCOPE);
  assert.equal(r.risk, 'high');
  assert.ok(r.affectedDimensions.some((d) => d.dim === 'D4'));
});
