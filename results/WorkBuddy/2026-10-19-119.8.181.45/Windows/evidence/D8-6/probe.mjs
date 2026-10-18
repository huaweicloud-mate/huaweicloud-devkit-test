import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const caseId = 'D8-6';
const executedAt = '20261019051558';
try {
  const readmePath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/README.md';
  const exists = existsSync(readmePath);
  const content = exists ? readFileSync(readmePath, 'utf8') : '';
  const hasContent = content.length > 100;
  const status = (exists && hasContent) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'README exists=' + exists + ' len=' + content.length, executedAt, result: { exists, len: content.length } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
