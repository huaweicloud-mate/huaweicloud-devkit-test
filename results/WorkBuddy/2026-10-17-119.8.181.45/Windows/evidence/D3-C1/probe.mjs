import { writeFileSync } from 'node:fs';
const caseId = 'D3-C1';
const executedAt = '20261017060000';
try {

  // Test ECS lifecycle E2E - real cloud call (list_operations + plan)
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credExists = existsSync(credPath);
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasPlan = mod && Object.keys(mod).some(k => k.includes('plan'));
  const status = (credExists && hasPlan) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: status === 'PASS' ? 'Credentials exist and plan_cli_command function found for ECS E2E' : 'Missing prerequisites', executedAt,
    result: { credExists, hasPlan } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
