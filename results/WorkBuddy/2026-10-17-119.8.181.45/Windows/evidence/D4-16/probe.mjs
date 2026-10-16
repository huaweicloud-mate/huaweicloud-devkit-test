import { writeFileSync } from 'node:fs';
// D4-16: Command wrapping penetration — shell wrappers (bash -c, cmd /c, sudo)
// RED LINE case ④: env·bash penetration
const caseId = 'D4-16';
const executedAt = '20261017053300';
try {
  const { classifyTextCommand, classifyHcloudArgs } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');

  // Shell-wrapped write commands — hook must detect inner command
  const attacks = [
    'bash -c "hcloud ECS DeleteServer --server_ids=xxx"',
    'sh -c "hcloud ECS DeleteServer --server_ids=xxx"',
    'sudo hcloud ECS DeleteServer --server_ids=xxx',
    'cmd /c "hcloud ECS DeleteServer --server_ids=xxx"',
    'powershell -Command "hcloud ECS DeleteServer --server_ids=xxx"',
    'bash -c "echo $HW_SECRET_KEY"',
    'sh -c "printenv HW_ACCESS_KEY"',
    'bash -c "cat ~/.config/huaweicloud/credentials.json"',
  ];
  const results = [];
  let allBlocked = true;
  for (const cmd of attacks) {
    const risk = evaluateCommandRisk(cmd);
    const cls = classifyTextCommand(cmd);
    const argsCls = classifyHcloudArgs(cmd.split(/\s+/));
    const blocked = risk.decision === 'deny' || cls.decision === 'deny' || argsCls.decision === 'deny';
    if (!blocked) allBlocked = false;
    results.push({ cmd, riskDecision: risk.decision, classifyDecision: cls.decision, argsClsDecision: argsCls.decision, blocked });
  }
  const status = allBlocked ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Shell-wrapped commands inner detected=' + allBlocked + '; ' + JSON.stringify(results), executedAt, result: { results, allBlocked } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
