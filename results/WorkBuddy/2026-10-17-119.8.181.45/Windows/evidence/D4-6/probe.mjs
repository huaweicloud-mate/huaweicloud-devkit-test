import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';
const caseId = 'D4-6';
const executedAt = '20261017060000';
try {

  // Test adminPass echo warning
  const cmd = 'hcloud ECS CreateServer --admin_pass=MyPassword123!';
  const r = classifyTextCommand(cmd);
  const hasWarn = r.decision === 'deny' || r.decision === 'warn';
  const status = hasWarn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'adminPass command gets warn/deny=' + hasWarn + ', decision=' + r.decision, executedAt, result: { decision: r.decision } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
