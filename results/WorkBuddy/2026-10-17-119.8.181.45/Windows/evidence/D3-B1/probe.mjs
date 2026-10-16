import { writeFileSync } from 'node:fs';
const caseId = 'D3-B1';
const executedAt = '20261017060000';
try {

  // Test list_operations standard names
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasListOps = mod && Object.keys(mod).some(k => k.includes('list_operations') || k.includes('listOperations'));
  const status = hasListOps ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'list_operations function found in tools module=' + hasListOps, executedAt,
    result: { hasListOps, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
