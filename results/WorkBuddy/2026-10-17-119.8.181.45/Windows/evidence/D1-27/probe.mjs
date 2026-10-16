import { writeFileSync } from 'node:fs';
// D1-27: judgeUpdate — current version is latest → up_to_date
const caseId = 'D1-27';
const executedAt = '20261017061100';
try {
  const { judgeUpdate } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  // Current = latest → up_to_date
  const distTags = { latest: '1.1.8', next: '1.1.9-next.0' };
  const result = judgeUpdate('1.1.8', distTags, { dismissedVersion: null });
  const isUpToDate = result.result === 'up_to_date' && result.updateAvailable === false;
  const status = isUpToDate ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'judgeUpdate(1.1.8, latest=1.1.8): result=' + result.result + ', updateAvailable=' + result.updateAvailable, executedAt, result: { judgeUpdateResult: result, isUpToDate } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
