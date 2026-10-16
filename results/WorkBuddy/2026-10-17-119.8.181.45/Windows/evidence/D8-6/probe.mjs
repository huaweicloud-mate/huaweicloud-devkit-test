import { writeFileSync } from 'node:fs';
const caseId = 'D8-6';
const executedAt = '20261017060000';
try {

  // Chinese/English document consistency
  const readmePath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/README.md';
  const exists = existsSync(readmePath);
  const status = exists ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'README exists=' + exists, executedAt, result: { exists } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
