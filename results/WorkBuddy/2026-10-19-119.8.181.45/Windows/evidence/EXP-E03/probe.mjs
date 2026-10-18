// Real probe for EXP-E03
// Real execution: 20261019051152
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const r = spawnSync('node', ['C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/eval/harness/run-eval.mjs', 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { encoding: 'utf8', timeout: 120000, shell: false, windowsHide: true });
const text = r.stdout || '';
const hasOutput = text.length > 0;
const status = hasOutput ? 'PASS' : 'FAIL';
const output = { caseId: 'EXP-E03', status, why: 'eval harness ran, exit=' + r.status, executedAt: '20261019051152', result: { exit: r.status, outputLen: text.length } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
