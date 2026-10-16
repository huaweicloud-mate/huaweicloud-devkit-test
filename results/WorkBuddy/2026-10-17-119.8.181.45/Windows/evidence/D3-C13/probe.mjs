import { writeFileSync } from 'node:fs';
const caseId = 'D3-C13';
const executedAt = '20261017060000';
try {

  // OBS static website hosting config
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasObsConfig = mod && Object.keys(mod).some(k => k.includes('obs') && k.includes('website'));
  const status = hasObsConfig ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'OBS website config function found=' + hasObsConfig, executedAt, result: { hasObsConfig } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
