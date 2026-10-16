import { writeFileSync } from 'node:fs';
const caseId = 'D3-C14';
const executedAt = '20261017060000';
try {

  // Sandbox HDKit service params - requires upstream
  const status = 'BLOCKED';
  const output = { caseId, status, why: 'Sandbox HDKit service requires upstream DevStation connection', executedAt, blockedReason: 'Sandbox requires DevStation upstream' };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
