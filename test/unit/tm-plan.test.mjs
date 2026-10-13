// Layer 2 契约单测：test-manager/tm-plan.mjs AI 决策引擎
// 覆盖 test-ai-orchestration-architecture.md §2.2：影响域分析、风险聚合、策略/使命生成。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeImpact,
  aggregateRisk,
  generateStrategy,
  generateMissions,
  planTestRun,
} from '../../test-manager/tm-plan.mjs';

test('analyzeImpact: 安全模块变更命中 D4', () => {
  const { affectedDimensions } = analyzeImpact({ changedFiles: ['safety-policy.mjs'] });
  assert.ok(affectedDimensions.some((d) => d.dim === 'D4'));
  const d4 = affectedDimensions.find((d) => d.dim === 'D4');
  assert.equal(d4.risk, 'high');
  assert.ok(d4.cases.includes('D4-5'));
  assert.ok(d4.modules.includes('safety-policy'));
});

test('analyzeImpact: auth 子目录（auth/credentials.mjs）命中 D2', () => {
  const { affectedDimensions } = analyzeImpact({ changedFiles: ['auth/credentials.mjs'] });
  assert.ok(affectedDimensions.some((d) => d.dim === 'D2'));
  assert.ok(affectedDimensions.find((d) => d.dim === 'D2').risk === 'high');
});

test('analyzeImpact: mcp-server 变更命中 D9（协议）', () => {
  const { affectedDimensions } = analyzeImpact({ changedFiles: ['mcp-server.mjs', 'mcp-protocol.mjs'] });
  assert.ok(affectedDimensions.some((d) => d.dim === 'D9'));
});

test('analyzeImpact: 工具名变更映射到维度', () => {
  const { affectedDimensions } = analyzeImpact({ changedTools: ['huaweicloud_hook_check_command'] });
  assert.ok(affectedDimensions.some((d) => d.dim === 'D4'));
});

test('analyzeImpact: 未知文件不产生维度', () => {
  const { affectedDimensions } = analyzeImpact({ changedFiles: ['README.md', 'docs/foo.md'] });
  assert.equal(affectedDimensions.length, 0);
});

test('aggregateRisk: 任一 high → high / 任一 medium → medium / 全 low → low', () => {
  assert.equal(aggregateRisk([{ risk: 'high' }]), 'high');
  assert.equal(aggregateRisk([{ risk: 'high' }, { risk: 'low' }]), 'high');
  assert.equal(aggregateRisk([{ risk: 'medium' }, { risk: 'low' }]), 'medium');
  assert.equal(aggregateRisk([{ risk: 'low' }]), 'low');
  assert.equal(aggregateRisk([]), 'low');
});

test('generateStrategy: high 风险含固定基线且 fullSuite', () => {
  const s = generateStrategy({ version: 'v1.2.0', changeScope: { changedFiles: ['safety-policy.mjs'] } });
  assert.equal(s.risk, 'high');
  assert.equal(s.recommended.fullSuite, true);
  assert.ok(s.recommended.fixedBaselines.includes('D4 全量'));
});

test('generateStrategy: low 风险建议冒烟', () => {
  const s = generateStrategy({ version: 'v1.2.0', changeScope: { changedFiles: ['search-market.mjs'] } });
  assert.equal(s.risk, 'low');
  assert.equal(s.recommended.fullSuite, false);
});

test('generateMissions: 每个受影响维度生成一个使命，含 criteria', () => {
  const s = generateStrategy({ version: 'v1.2.0', changeScope: { changedFiles: ['safety-policy.mjs', 'mcp-server.mjs'] } });
  const missions = generateMissions({ strategy: s });
  assert.equal(missions.length, s.affectedDimensions.length);
  for (const m of missions) {
    assert.match(m.missionId, /^mission-\d{3}$/);
    assert.ok(m.scope.length > 0);
    assert.ok(m.qualityCriteria.length >= 1);
    assert.ok(m.affectedCases.length >= 1);
    assert.ok(['P0', 'P1', 'P2'].includes(m.priority));
  }
});

test('generateMissions: 高风险维度使命为 P0', () => {
  const s = generateStrategy({ version: 'v1.2.0', changeScope: { changedFiles: ['safety-policy.mjs'] } });
  const missions = generateMissions({ strategy: s });
  assert.equal(missions[0].priority, 'P0');
});

test('planTestRun: 一站式输出策略+使命，空变更产生空影响但策略仍可生成', () => {
  const { strategy, missions } = planTestRun({ version: 'v1.2.0', changeScope: { changedFiles: [] } });
  assert.ok(strategy);
  assert.equal(strategy.risk, 'low');
  assert.equal(missions.length, 0);
});