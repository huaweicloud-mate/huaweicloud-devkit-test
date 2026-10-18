import { writeFileSync } from 'node:fs';
import { applyUpdateHint, judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const hint = judgeUpdate('1.1.8', { latest: '1.1.9' }, undefined);
const r1 = applyUpdateHint({ name: 'huaweicloud_search_docs' }, 'huaweicloud_search_docs', hint);
const hasHint1 = !!r1._updateInfo;
const r2 = applyUpdateHint({ name: 'huaweicloud_list_operations' }, 'huaweicloud_list_operations', hint);
const hasHint2 = !!r2._updateInfo;
// check_update/upgrade tools should NOT get hint
const r3 = applyUpdateHint({ name: 'huaweicloud_check_update' }, 'huaweicloud_check_update', hint);
const hasHint3 = !!r3._updateInfo;
const status = (hasHint1 && hasHint2 && !hasHint3) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-45', status, why: 'hint1=' + hasHint1 + ' hint2=' + hasHint2 + ' checkUpdateNoHint=' + !hasHint3, executedAt: '20261019051813', result: { hasHint1, hasHint2, hasHint3, hintResult: hint?.result } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
