import { writeFileSync } from 'node:fs';
// D4-9: Public exposure / destructive pre-check — public exposure & destructive ops blocked
const caseId = 'D4-9';
const executedAt = '20261017053100';
try {
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // Public exposure + destructive commands
  const attacks = [
    'hcloud ECS CreateServer --public_ip=true',
    'hcloud VPC CreateSecurityGroupRule --direction=ingress --port_range=0-65535 --protocol=all --remote_ip_prefix=0.0.0.0/0',
    'hcloud ECS DeleteServer --server_ids=xxx --force',
    'hcloud RDS DeleteInstance --instance_id=xxx --force',
    'hcloud ECS ResetServerPassword --server_id=xxx',
    'hcloud IAM DeleteUser --user_id=xxx',
    'rm -rf /',
    'hcloud ECS DeleteServers --delete_public_ip',
  ];
  const results = [];
  let allBlocked = true;
  for (const cmd of attacks) {
    const risk = evaluateCommandRisk(cmd);
    const cls = classifyTextCommand(cmd);
    const blocked = risk.decision === 'deny' || risk.decision === 'warn' || cls.decision === 'deny';
    if (!blocked) allBlocked = false;
    results.push({ cmd, riskDecision: risk.decision, classifyDecision: cls.decision, blocked });
  }
  const status = allBlocked ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Public exposure/destructive commands blocked=' + allBlocked + '; ' + JSON.stringify(results), executedAt, result: { results, allBlocked } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
