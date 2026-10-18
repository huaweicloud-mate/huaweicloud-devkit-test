import { writeFileSync } from 'node:fs';
const caseId = 'D2-26';
const executedAt = '20261019051332';
try {

  // Test credential backup and restore
  let hasBackupFn = false;
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
    hasBackupFn = Object.keys(mod).some(k => k.includes('backup') || k.includes('restore') || k.includes('sync'));
  } catch(e) {}
  // Also check auth/service.mjs
  if (!hasBackupFn) {
    try { const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/service.mjs'); hasBackupFn = Object.keys(mod).some(k => k.includes('backup') || k.includes('restore')); } catch(e2) {}
  }
  const status = hasBackupFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Auth module has backup/restore functions=' + hasBackupFn, executedAt, result: { hasBackupFn } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
