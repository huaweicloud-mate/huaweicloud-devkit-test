import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';
const caseId = 'D4-29';
const executedAt = '20261017060000';
try {

  // Classification assertion and raw command classification entry
  const r1 = classifyTextCommand('hcloud ECS ListServers');
  const r2 = classifyHcloudArgs(['ECS', 'ListServers']);
  const hasDecision1 = r1.decision && ['deny','warn','allow'].includes(r1.decision);
  const hasDecision2 = r2 && r2.decision && ['deny','warn','allow'].includes(r2.decision);
  const status = (hasDecision1 && hasDecision2) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Classification entry: text=' + hasDecision1 + ', args=' + hasDecision2, executedAt, result: { r1: r1.decision, r2: r2?.decision } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
