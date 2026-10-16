import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';
const caseId = 'D4-4';
const executedAt = '20261017060000';
try {

  // Test write operation approval gate
  const writeCmds = ['hcloud ECS DeleteServer --server_ids=xxx', 'hcloud IAM DeleteUser --user_id=xxx', 'hcloud VPC DeleteVpc --vpc_id=xxx'];
  let allDeny = true;
  const results = [];
  for (const cmd of writeCmds) {
    const r = classifyTextCommand(cmd);
    const isDeny = r.decision === 'deny' || r.decision === 'warn';
    if (!isDeny) allDeny = false;
    results.push({ cmd, decision: r.decision });
  }
  const status = allDeny ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Write commands require approval=' + allDeny, executedAt, result: { results } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
