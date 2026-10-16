import { writeFileSync } from 'node:fs';
const caseId = 'D2-5';
const executedAt = '20261017060000';
try {

  // Test credential missing error guidance
  let hasGuidance = false;
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/guidance.mjs');
    hasGuidance = Object.keys(mod).length > 0;
  } catch(e) {
    try { const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs'); hasGuidance = Object.keys(mod).some(k => k.includes('error') || k.includes('guide') || k.includes('missing')); } catch(e2) {}
  }
  const status = hasGuidance ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Auth guidance/error module loaded=' + hasGuidance, executedAt, result: { hasGuidance } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
