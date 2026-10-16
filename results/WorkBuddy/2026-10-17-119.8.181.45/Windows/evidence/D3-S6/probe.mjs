import { writeFileSync } from 'node:fs';
const caseId = 'D3-S6';
const executedAt = '20261017060000';
try {

  // FunctionGraph timer
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasFn = mod && Object.keys(mod).some(k => k.includes('plan'));
  const status = hasFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'plan for FunctionGraph timer=' + hasFn, executedAt, result: { hasFn } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
