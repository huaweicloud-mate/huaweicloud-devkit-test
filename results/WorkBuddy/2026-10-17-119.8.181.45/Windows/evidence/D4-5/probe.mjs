import { writeFileSync } from 'node:fs';
// D4-5: Write operation misjudgment detection — write ops must NOT be misjudged as read-only/allow
const caseId = 'D4-5';
const executedAt = '20261017052900';
try {
  const { classifyHcloudArgs } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');

  // Real write/delete commands — must be classified as write/deny/warn, not allow/read-only
  const writeCmds = [
    ['hcloud', 'ECS', 'DeleteServer', '--server_ids=xxx'],
    ['hcloud', 'IAM', 'DeleteUser', '--user_id=xxx'],
    ['hcloud', 'VPC', 'DeleteVpc', '--vpc_id=xxx'],
    ['hcloud', 'ECS', 'CreateServer', '--name=test'],
    ['hcloud', 'RDS', 'DeleteInstance', '--instance_id=xxx'],
    ['hcloud', 'ECS', 'UpdateServer', '--server_id=xxx'],
  ];
  const results = [];
  let allWrite = true;
  for (const args of writeCmds) {
    const cls = classifyHcloudArgs(args);
    const risk = evaluateCommandRisk(args.join(' '));
    // Write detected if: decision=deny/warn, or risk=write, or risk decision=deny/warn
    const isWrite = cls.decision === 'deny' || cls.decision === 'warn' || cls.risk === 'write' || cls.risk === 'execution' || risk.decision === 'deny' || risk.decision === 'warn';
    if (!isWrite) allWrite = false;
    results.push({ cmd: args.slice(1).join(' '), clsDecision: cls.decision, clsRisk: cls.risk, riskDecision: risk.decision, detected: isWrite });
  }
  const status = allWrite ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Write commands not misjudged as read-only=' + allWrite + '; ' + JSON.stringify(results), executedAt, result: { results, allWrite } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
