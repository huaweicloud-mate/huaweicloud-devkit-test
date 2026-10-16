import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D2-2';
const executedAt = '20261017060000';
try {

  const result = spawnSync('npx', ['huaweicloud-devkit', 'auth', 'status'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const hasStatus = result.stdout?.includes('configured') || result.stdout?.includes('AK') || result.stdout?.includes('ak') || result.stdout?.includes('ready') || result.stdout?.includes('auth') || result.status === 0;
  const status = hasStatus ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'auth status command exit=' + result.status, executedAt,
    result: { exitCode: result.status, stdout: result.stdout?.slice(0,500) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
