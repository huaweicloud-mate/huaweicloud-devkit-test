import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D5-1';
const executedAt = '20261019051332';
try {

  // Manifest discovery loading
  const result = spawnSync('npx', ['huaweicloud-devkit', 'plugins'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const hasPlugins = result.stdout?.includes('huaweicloud') || result.stdout?.includes('plugin') || result.status === 0;
  const status = hasPlugins ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Plugins listing exit=' + result.status, executedAt,
    result: { exitCode: result.status, stdout: result.stdout?.slice(0,300) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
