import { writeFileSync } from 'node:fs';
const caseId = 'D4-26';
const executedAt = '20261016050729';
try {

  import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
  // Findings evidence redaction
  const testFindings = { ak: 'TESTAKXXXXXXXXXXXXXXXX', sk: 'TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', finding: 'credential leak' };
  const redacted = redactSecrets(testFindings);
  const hasLeak = JSON.stringify(redacted).includes('TESTAK') || JSON.stringify(redacted).includes('TESTSK');
  const status = !hasLeak ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Findings redaction: no leak=' + !hasLeak, executedAt, result: { hasLeak, redacted: JSON.stringify(redacted).slice(0,100) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
