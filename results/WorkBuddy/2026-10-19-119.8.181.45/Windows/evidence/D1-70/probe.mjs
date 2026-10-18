// Real probe for D1-70
// Real execution: 20261019051332
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
// Test proxy config via hcloud CLI or setup-cli
const r = spawnSync('npx', ['huaweicloud-devkit', 'status'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
const hasOutput = (r.stdout || '').length > 0;
const status = (r.status === 0 && hasOutput) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-70', status, why: 'status command exit=' + r.status, executedAt: '20261019051332', result: { exit: r.status, outputLen: (r.stdout||'').length, sample: (r.stdout||'').slice(0,200) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
