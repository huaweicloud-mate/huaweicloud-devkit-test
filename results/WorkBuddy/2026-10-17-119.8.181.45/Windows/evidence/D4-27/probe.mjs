import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';
const caseId = 'D4-27';
const executedAt = '20261017060000';
try {

  // Dual path output redaction
  const testInput = { stdout: 'AK=TESTAKXXXXXXXXXXXXXXXX SK=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', stderr: 'ak=testak sk=testsk' };
  const redacted = redactSecrets(testInput);
  const stdoutLeak = JSON.stringify(redacted.stdout || '').includes('TESTAK');
  const stderrLeak = JSON.stringify(redacted.stderr || '').includes('testak');
  const status = (!stdoutLeak && !stderrLeak) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Dual path redaction: stdout_leak=' + stdoutLeak + ', stderr_leak=' + stderrLeak, executedAt, result: { stdoutLeak, stderrLeak } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
