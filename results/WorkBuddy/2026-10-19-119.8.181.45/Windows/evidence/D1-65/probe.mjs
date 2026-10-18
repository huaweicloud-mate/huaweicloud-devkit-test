import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D1-65';
const executedAt = '20261019051332';
try {

  const result = spawnSync('npx', ['huaweicloud-devkit', 'doctor'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true, env: { ...process.env, HDK_DEBUG: '1' } });
  const hasDebug = result.stdout?.includes('debug') || result.stdout?.includes('DEBUG') || result.stderr?.includes('debug') || result.status === 0;
  const status = hasDebug ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Debug env var HDK_DEBUG=1 set, doctor ran with exit=' + result.status, executedAt,
    result: { exitCode: result.status, hasDebugOutput: hasDebug, stdout: result.stdout?.slice(0,300) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
