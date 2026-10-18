// Real probe for D1-28
// Real execution: 20261019051332
import { writeFileSync } from 'node:fs';
import { judgeUpdate } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const current = '1.1.8';
const tags = { latest: '1.1.9', next: '1.1.9-next.3' };
const hint = judgeUpdate(current, tags, undefined);
const status = (hint.result === 'update_available' && hint.updateAvailable === true && hint.targetVersion === '1.1.9') ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-28', status, why: 'result=' + hint.result + ' target=' + hint.targetVersion, executedAt: '20261019051332', result: { result: hint.result, updateAvailable: hint.updateAvailable, targetVersion: hint.targetVersion } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
