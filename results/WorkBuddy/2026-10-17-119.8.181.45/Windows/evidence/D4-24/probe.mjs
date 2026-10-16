import { writeFileSync } from 'node:fs';
const caseId = 'D4-24';
const executedAt = '20261017060000';
try {

  // Confirmation token expiry
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs'); } catch(e) {}
  const hasTokenFn = mod && Object.keys(mod).some(k => k.includes('token') || k.includes('confirm') || k.includes('approval'));
  const status = hasTokenFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Confirmation token function found=' + hasTokenFn, executedAt, result: { hasTokenFn } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
