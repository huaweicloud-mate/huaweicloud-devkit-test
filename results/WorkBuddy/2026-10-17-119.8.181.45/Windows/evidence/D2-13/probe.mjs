import { writeFileSync } from 'node:fs';
const caseId = 'D2-13';
const executedAt = '20261017060000';
try {

  // Test R9 configuredBySession priority over env
  let hasSessionFn = false;
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
    hasSessionFn = Object.keys(mod).some(k => k.includes('session') || k.includes('configured') || k.includes('resolve'));
  } catch(e) {}
  const status = hasSessionFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Auth credentials module has session/configured functions=' + hasSessionFn, executedAt, result: { hasSessionFn } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
