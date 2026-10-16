import { writeFileSync } from 'node:fs';
const caseId = 'D3-C5';
const executedAt = '20261017060000';
try {

  // Tool smoke test - check_cli/list_operations/plan
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const toolCount = mod ? Object.keys(mod).length : 0;
  const hasCheck = mod && Object.keys(mod).some(k => k.includes('check'));
  const status = (toolCount > 5 && hasCheck) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Tools module has ' + toolCount + ' exports, check function=' + hasCheck, executedAt,
    result: { toolCount, hasCheck, keys: mod ? Object.keys(mod).slice(0,15) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
