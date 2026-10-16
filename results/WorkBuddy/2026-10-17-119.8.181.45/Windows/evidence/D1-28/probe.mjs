import { writeFileSync } from 'node:fs';
// D1-28: judgeUpdate — newer version available → update_available
const caseId = 'D1-28';
const executedAt = '20261017061200';
try {
  const { judgeUpdate } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  // Current = 1.0.0, latest = 1.1.8 → update_available
  const distTags = { latest: '1.1.8', next: '1.1.9-next.0' };
  const result = judgeUpdate('1.0.0', distTags, { dismissedVersion: null });
  const isUpdateAvailable = result.result === 'update_available' && result.updateAvailable === true && result.targetVersion === '1.1.8';
  const status = isUpdateAvailable ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'judgeUpdate(1.0.0, latest=1.1.8): result=' + result.result + ', updateAvailable=' + result.updateAvailable + ', targetVersion=' + result.targetVersion, executedAt, result: { judgeUpdateResult: result, isUpdateAvailable } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
