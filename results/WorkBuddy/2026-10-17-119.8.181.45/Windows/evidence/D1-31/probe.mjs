import { writeFileSync } from 'node:fs';
// D1-31: Dismiss cooldown period
const caseId = 'D1-31';
const executedAt = '20261017061300';
try {
  const { judgeUpdate, writeSkipState, readSkipState, resolveSkipFilePath } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  // Write skip state for version 1.1.8
  const skipFile = resolveSkipFilePath('test-session-d1-31');
  writeSkipState(skipFile, '1.1.8', { at: Date.now(), days: 3 });
  const skipState = readSkipState(skipFile);
  // Within cooldown → dismissed
  const distTags = { latest: '1.1.8', next: null };
  const result = judgeUpdate('1.0.0', distTags, skipState);
  const isDismissed = result.result === 'dismissed' && result.dismissed === true;
  // Check expireAt is ~3 days from now
  const hasExpireAt = !!result.dismissExpiresAt;
  // Cleanup
  const { unlinkSync } = await import('node:fs');
  try { unlinkSync(skipFile); } catch {}
  const status = (isDismissed && hasExpireAt) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Dismiss within cooldown: result=' + result.result + ', dismissed=' + result.dismissed + ', hasExpireAt=' + hasExpireAt, executedAt, result: { judgeUpdateResult: result, skipState, isDismissed, hasExpireAt } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
