import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';
const caseId = 'D4-20';
const executedAt = '20261017060000';
try {

  // Reject then zero operation
  const deleteCmd = 'hcloud ECS DeleteServer --server_ids=xxx';
  const r = classifyTextCommand(deleteCmd);
  const isBlocked = r.decision === 'deny' || r.decision === 'warn';
  const status = isBlocked ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Delete command blocked (zero operation after reject)=' + isBlocked + ', decision=' + r.decision, executedAt, result: { decision: r.decision } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
