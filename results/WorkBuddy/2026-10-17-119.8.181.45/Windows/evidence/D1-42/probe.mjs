import { writeFileSync } from 'node:fs';
// D1-42: Dismiss real loop + cross-call persistence
const caseId = 'D1-42';
const executedAt = '20261017061500';
try {
  const { judgeUpdate, writeSkipState, readSkipState, resolveSkipFilePath } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  // 1) First check: update available
  const distTags = { latest: '1.1.8', next: null };
  const firstCheck = judgeUpdate('1.0.0', distTags, { dismissedVersion: null });
  const firstIsUpdate = firstCheck.result === 'update_available';
  // 2) Write skip file (dismiss)
  const skipFile = resolveSkipFilePath('test-session-d1-42');
  writeSkipState(skipFile, '1.1.8', { at: Date.now(), days: 3 });
  // 3) Verify skip file exists and has correct fields
  const skipState = readSkipState(skipFile);
  const hasExpireAt = skipState && skipState.expireAt;
  // 4) Second check: should be dismissed
  const secondCheck = judgeUpdate('1.0.0', distTags, skipState);
  const secondIsDismissed = secondCheck.result === 'dismissed';
  // 5) Simulate process restart: re-read skip file
  const rereadState = readSkipState(skipFile);
  const persistsAcrossRestart = rereadState && rereadState.dismissedVersion === '1.1.8';
  // Cleanup
  const { unlinkSync } = await import('node:fs');
  try { unlinkSync(skipFile); } catch {}
  const status = (firstIsUpdate && hasExpireAt && secondIsDismissed && persistsAcrossRestart) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'First check update_available=' + firstIsUpdate + '; skip file written with expireAt=' + !!hasExpireAt + '; second check dismissed=' + secondIsDismissed + '; persists across restart=' + persistsAcrossRestart, executedAt, result: { firstCheck: firstCheck.result, skipState, secondCheck: secondCheck.result, rereadState, firstIsUpdate, hasExpireAt, secondIsDismissed, persistsAcrossRestart } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
