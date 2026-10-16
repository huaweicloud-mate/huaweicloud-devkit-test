import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D1-69';
const executedAt = '20261017060000';
try {

  const result = spawnSync('npx', ['huaweicloud-devkit', '--help'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  const hasHelp = result.stdout?.includes('install') || result.stdout?.includes('status') || result.stdout?.includes('doctor') || result.stdout?.includes('Usage') || result.stdout?.includes('upgrade');
  const status = hasHelp ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'CLI help output contains expected subcommands=' + hasHelp, executedAt,
    result: { exitCode: result.status, stdout: result.stdout?.slice(0,500) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
