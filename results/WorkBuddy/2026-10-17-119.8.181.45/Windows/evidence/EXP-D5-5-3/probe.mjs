import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'EXP-D5-5-3';
const executedAt = '20261017060000';
try {

    // EXP-D5-5-3: WorkBuddy client manifest + tool enumeration
    const r1 = spawnSync('npx', ['huaweicloud-devkit', 'plugins'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
    const r2 = spawnSync('npx', ['huaweicloud-devkit', 'status'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
    const hasOutput = r1.stdout?.length > 0 || r2.stdout?.length > 0;
    const status = hasOutput ? 'PASS' : 'FAIL';
    const output = { caseId, status, why: 'EXP-D5-5-3: plugins+status ran, exits=' + r1.status + ',' + r2.status, executedAt,
      result: { r1Exit: r1.status, r2Exit: r2.status, r1Stdout: r1.stdout?.slice(0,200), r2Stdout: r2.stdout?.slice(0,200) } };
    writeFileSync('stdout.log', JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
  
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
