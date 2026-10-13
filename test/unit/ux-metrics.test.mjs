// UX 体验度量单测（D11-40 支撑）——不依赖 dsh / 真实 LLM，纯函数可验证。
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareUxMetrics, extractUxMetrics, UX_METRIC_KEYS } from '../../eval/harness/ux-metrics.mjs';

test('三指标键固定为 steps/fails/clarifications', () => {
  assert.deepEqual(UX_METRIC_KEYS, ['steps', 'fails', 'clarifications']);
});

test('extractUxMetrics: 从真实形态输出提取三指标', () => {
  const out = [
    '准备调用 huaweicloud_run_readonly_command 查询 ECS',
    'hcloud ECS ListServersDetails --cli-region=cn-north-4',
    'tool #7 完成',
    '抱歉 这次查询失败了 服务返回 error 500',
    '请问你要查的是哪个 region？需要你补充一下',
  ].join('\n');
  const m = extractUxMetrics(out);
  // steps 以 tool #N 的最大值兜底（比特征词计数更接近真实步数）
  assert.equal(m.steps, 7);
  assert.ok(m.fails >= 2, `fails 应 >= 2，实际 ${m.fails}`);
  assert.ok(m.clarifications >= 2, `clarifications 应 >= 2，实际 ${m.clarifications}`);
});

test('extractUxMetrics: 无 tool #N 时按动作特征词计数', () => {
  const out = [
    'exec_command: hcloud ECS ListServersDetails',
    'read_file: /tmp/a.json',
    'write_file: /tmp/b.json',
  ].join('\n');
  const m = extractUxMetrics(out);
  assert.equal(m.steps, 3);
  assert.equal(m.fails, 0);
  assert.equal(m.clarifications, 0);
});

test('extractUxMetrics: 输出为空时回落到 evidence 计数', () => {
  const m = extractUxMetrics('', { commands: ['ECS ListServersDetails'], tools: ['explain_error'] });
  assert.equal(m.steps, 2);
  assert.equal(m.fails, 0);
});

test('extractUxMetrics: 干净输出三指标均为 0', () => {
  const m = extractUxMetrics('已经为你查到 2 台云主机，均处于运行中。');
  assert.deepEqual(m, { steps: 0, fails: 0, clarifications: 0 });
});

test('compareUxMetrics: 不劣化且至少一项改善 → 通过', () => {
  const r = compareUxMetrics(
    { steps: 9, fails: 3, clarifications: 2 },
    { steps: 7, fails: 3, clarifications: 2 },
  );
  assert.equal(r.pass, true);
  assert.deepEqual(r.regressed, []);
  assert.deepEqual(r.improved, ['steps']);
});

test('compareUxMetrics: 任一项恶化 → 不通过（即使其他项改善）', () => {
  const r = compareUxMetrics(
    { steps: 9, fails: 3, clarifications: 2 },
    { steps: 5, fails: 4, clarifications: 2 },
  );
  assert.equal(r.pass, false);
  assert.deepEqual(r.regressed, ['fails']);
});

test('compareUxMetrics: 三项持平 → 不通过（未改善）', () => {
  const r = compareUxMetrics(
    { steps: 9, fails: 3, clarifications: 2 },
    { steps: 9, fails: 3, clarifications: 2 },
  );
  assert.equal(r.pass, false);
  assert.deepEqual(r.improved, []);
});

test('compareUxMetrics: 三项全部改善 → 通过且 delta 正确', () => {
  const r = compareUxMetrics(
    { steps: 9, fails: 3, clarifications: 2 },
    { steps: 6, fails: 1, clarifications: 0 },
  );
  assert.equal(r.pass, true);
  assert.equal(r.detail.steps.delta, -3);
  assert.equal(r.detail.fails.delta, -2);
  assert.equal(r.detail.clarifications.delta, -2);
});
