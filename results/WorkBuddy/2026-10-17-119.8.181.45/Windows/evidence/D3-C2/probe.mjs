import { writeFileSync } from 'node:fs';
const caseId = 'D3-C2';
const executedAt = '20261017060000';
try {

  // OBS static site E2E
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasObs = mod && Object.keys(mod).some(k => k.includes('obs') || k.includes('website'));
  const status = hasObs ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'OBS website config function found=' + hasObs, executedAt, result: { hasObs } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
