import { writeFileSync } from 'node:fs';
const caseId = 'D3-C7';
const executedAt = '20261017060000';
try {

  // Cross-region resource operation
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasRegion = mod && Object.keys(mod).some(k => k.includes('region') || k.includes('list_regions'));
  const status = hasRegion ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Cross-region function found=' + hasRegion, executedAt, result: { hasRegion } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
