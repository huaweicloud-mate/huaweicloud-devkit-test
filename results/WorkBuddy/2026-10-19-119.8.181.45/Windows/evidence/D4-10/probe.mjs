import { writeFileSync } from 'node:fs';
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
const caseId = 'D4-10';
const executedAt = '20261019051332';
try {

  // Rule library regression - test new rules
  const testCmds = [
    { cmd: 'cat ~/.hcloud/config.json', expected: 'deny' },
    { cmd: 'printenv HW_ACCESS_KEY', expected: 'deny' },
    { cmd: 'hcloud ECS ListServers', expected: 'allow' },
  ];
  let allPass = true;
  const results = [];
  for (const { cmd, expected } of testCmds) {
    const r = classifyTextCommand(cmd);
    const match = r.decision === expected;
    if (!match) allPass = false;
    results.push({ cmd, expected, actual: r.decision, match });
  }
  const status = allPass ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Rule library regression all pass=' + allPass, executedAt, result: { results } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
