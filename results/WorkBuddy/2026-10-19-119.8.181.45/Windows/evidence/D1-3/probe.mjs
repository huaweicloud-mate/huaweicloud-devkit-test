import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D1-3';
const executedAt = '20261019051332';
try {

  const result = spawnSync('npx', ['huaweicloud-devkit', 'doctor'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const hasHealth = stdout.includes('OK') || stdout.includes('ok') || stdout.includes('healthy') || stdout.includes('pass') || stdout.includes('PASS') || stdout.includes('ready') || stdout.includes('check') || stdout.includes('success');
  const status = (result.status === 0 || hasHealth) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: status === 'PASS' ? 'doctor command executed successfully, exit=' + result.status : 'doctor failed exit=' + result.status + ' stderr=' + stderr.slice(0,200), executedAt,
    result: { exitCode: result.status, stdout: stdout.slice(0,500), stderr: stderr.slice(0,200) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
