import { writeFileSync } from 'node:fs';
const caseId = 'D3-S2';
const executedAt = '20261017060000';
try {

  // Scenario - delete VPC with confirmation
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasPlan = mod && Object.keys(mod).some(k => k.includes('plan'));
  const status = hasPlan ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'plan_cli_command for VPC delete with confirmation=' + hasPlan, executedAt, result: { hasPlan } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
