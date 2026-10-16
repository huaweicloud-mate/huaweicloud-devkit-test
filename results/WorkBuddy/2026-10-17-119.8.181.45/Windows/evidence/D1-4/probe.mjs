import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D1-4';
const executedAt = '20261017060000';
try {

  const r1 = spawnSync('npx', ['huaweicloud-devkit', 'status'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const r2 = spawnSync('npx', ['huaweicloud-devkit', 'status'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const idempotent = r1.status === r2.status;
  const status = idempotent ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: status === 'PASS' ? 'status command idempotent: both exits=' + r1.status : 'status not idempotent', executedAt,
    result: { firstExit: r1.status, secondExit: r2.status, stdout: r1.stdout?.slice(0,300) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
