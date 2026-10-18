import { writeFileSync } from 'node:fs';
const caseId = 'D3-S3';
const executedAt = '20261019051332';
try {

  // Sandbox preview URL - requires DevStation
  const status = 'BLOCKED';
  const output = { caseId, status, why: 'Sandbox preview requires DevStation upstream', executedAt, blockedReason: 'Sandbox requires DevStation' };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
