import { writeFileSync } from 'node:fs';
// D4-15: Hook bypass attempts — Deleteserver case variants, URL encoding, param splitting
const caseId = 'D4-15';
const executedAt = '20261017053200';
try {
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // Adversarial bypass attempts: case variants, URL encoding, param splitting
  const attacks = [
    'hcloud ECS deleteserver --server_ids=xxx',
    'hcloud ECS DELETEserver --server_ids=xxx',
    'hcloud ECS DeleteServer --server_ids%3Dxxx',
    'hcloud%20ECS%20DeleteServer%20--server_ids%3Dxxx',
    'hcloud ECS Delete --server_ids=xxx Server',
    'hcloud ECS DeleteServer --server_ids=xxx --confirm',
    'hcloud ecs deleteserver --server_ids=xxx',
    'HCloud ECS DeleteServer --server_ids=xxx',
  ];
  const results = [];
  let noBypass = true;
  for (const cmd of attacks) {
    const risk = evaluateCommandRisk(cmd);
    const cls = classifyTextCommand(cmd);
    const blocked = risk.decision === 'deny' || risk.decision === 'warn' || cls.decision === 'deny';
    if (!blocked) noBypass = false;
    results.push({ cmd, riskDecision: risk.decision, classifyDecision: cls.decision, blocked });
  }
  const status = noBypass ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'No bypass succeeded=' + noBypass + '; ' + JSON.stringify(results), executedAt, result: { results, noBypass } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
