// Real probe for D1-31
// Real execution: 20261019051332
import { writeFileSync } from 'node:fs';
import { judgeUpdate, writeSkipState, readSkipState, resolveSkipFilePath } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const current = '1.1.8';
const tags = { latest: '1.1.9' };
const now = Date.now();
const skipFile = resolveSkipFilePath('test-session-d1-31');
writeSkipState(skipFile, '1.1.9', { at: now, days: 3 });
const skipState = readSkipState(skipFile);
const hint = judgeUpdate(current, tags, skipState, now);
const isDismissed = hint.result === 'dismissed' && hint.dismissed === true;
// After 4 days (past cooldown)
const hint2 = judgeUpdate(current, tags, skipState, now + 4 * 24 * 60 * 60 * 1000);
const isExpired = hint2.result === 'update_available';
const status = (isDismissed && isExpired) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-31', status, why: 'cooldown dismissed=' + isDismissed + ' expired=' + isExpired, executedAt: '20261019051332', result: { hint1Result: hint.result, hint2Result: hint2.result, dismissExpiresAt: hint.dismissExpiresAt } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
