import { writeFileSync } from 'node:fs';
const caseId = 'D3-B3';
const executedAt = '20261017060000';
try {

  // Test run_readonly redaction
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasReadonly = mod && Object.keys(mod).some(k => k.includes('readonly') || k.includes('run_readonly'));
  const status = hasReadonly ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'run_readonly function found=' + hasReadonly, executedAt,
    result: { hasReadonly, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
