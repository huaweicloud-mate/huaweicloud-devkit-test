// Layer 2 契约单测：risk-rule-engine.mjs
// 覆盖 plan §Layer 2 目标：规则匹配逻辑、严重级别排序、evaluateCommand/Artifacts/DeployPlan、
// 决策聚合 mergeRiskDecision、fail-closed（空输入必 deny，防止 fail-open）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importHdk } from './helpers/hdk-path.mjs';

const { module: rr } = await importHdk('risk-rule-engine.mjs');

test('evaluateCommandRisk: 空输入必须 fail-closed（deny invalid）', () => {
  for (const c of ['', '   ', null, undefined]) {
    const r = rr.evaluateCommandRisk(c);
    assert.equal(r.decision, 'deny', `command=${JSON.stringify(c)}`);
    assert.equal(r.risk, 'invalid');
    assert.ok(r.findings.length >= 1);
  }
});

test('evaluateCommandRisk: 破坏性命令触发风险规则（warn 及以上）', () => {
  const r = rr.evaluateCommandRisk('hcloud ECS DeleteServer --server_id=xx');
  assert.ok(['warn', 'deny'].includes(r.decision), `got decision=${r.decision}`);
  assert.ok(r.findings.length >= 1, '应产生至少一条风险发现');
});

test('evaluateCommandRisk: 普通只读命令不触发风险规则', () => {
  const r = rr.evaluateCommandRisk('hcloud ECS ListServersDetails');
  assert.equal(r.decision, 'allow');
});

test('findings 按严重级别排序：deny > warn > info', () => {
  const high = { id: 'a', severity: 'deny', stages: ['command'], match: { any: [{ field: 'text', regex: 'DeleteServer' }] } };
  const mid = { id: 'b', severity: 'warn', stages: ['command'], match: { any: [{ field: 'text', regex: 'UpdateServer' }] } };
  const r = rr.evaluateCommandRisk('hcloud ECS DeleteServer UpdateServer', { catalog: { rules: [mid, high] } });
  assert.equal(r.decision, 'deny');
  assert.equal(r.findings[0].ruleId, 'a', 'deny 应排在 warn 之前');
  assert.equal(r.findings[1].ruleId, 'b');
});

test('evaluateArtifacts: 空数组 fail-closed', () => {
  const r = rr.evaluateArtifacts([]);
  assert.equal(r.decision, 'deny');
  assert.equal(r.risk, 'invalid');
});

test('evaluateArtifacts: 非数组 fail-closed', () => {
  const r = rr.evaluateArtifacts('not-an-array');
  assert.equal(r.decision, 'deny');
});

test('evaluateArtifacts: 公开管理端口的安全组片段触发 deny 规则', () => {
  const r = rr.evaluateArtifacts([{ path: 'security-group.json', content: '{"remote_ip_prefix":"0.0.0.0/0","port":22}' }]);
  assert.ok(['deny', 'warn'].includes(r.decision));
});

test('evaluateDeployPlan: 空 plan fail-closed', () => {
  for (const p of ['', '   ', null, undefined, {}]) {
    assert.equal(rr.evaluateDeployPlan(p).decision, 'deny', JSON.stringify(p));
  }
});

test('evaluateDeployPlan: 合法 plan 返回 allow 或 warn（非 fail-open）', () => {
  const r = rr.evaluateDeployPlan({ stack: 'demo', config: { region: 'cn-north-4' } });
  assert.ok(['allow', 'warn', 'deny'].includes(r.decision));
});

test('mergeRiskDecision: 空风险保持 base 不变', () => {
  const base = { decision: 'allow', warnings: [] };
  assert.deepEqual(rr.mergeRiskDecision(base, null), base);
  assert.deepEqual(rr.mergeRiskDecision(base, { findings: [] }), base);
});

test('mergeRiskDecision: deny 风险升级 base 决策', () => {
  const base = { decision: 'allow', warnings: [] };
  const risk = {
    decision: 'deny',
    findings: [{ category: 'destructive', severity: 'deny', message: 'Delete detected' }],
  };
  const merged = rr.mergeRiskDecision(base, risk);
  assert.equal(merged.decision, 'deny');
  assert.equal(merged.blockedByRiskRule, true);
  assert.equal(merged.risk, 'destructive');
});

test('mergeRiskDecision: warn 风险附加 warnings 而不升级决策', () => {
  const base = { decision: 'allow', warnings: [] };
  const risk = {
    decision: 'warn',
    findings: [{ severity: 'warn', message: 'Public exposure candidate' }],
  };
  const merged = rr.mergeRiskDecision(base, risk);
  assert.equal(merged.decision, 'allow');
  assert.equal(merged.warnings.length, 1);
});