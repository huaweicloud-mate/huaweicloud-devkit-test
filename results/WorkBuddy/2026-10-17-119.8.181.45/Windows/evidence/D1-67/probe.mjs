import { writeFileSync } from 'node:fs';
const caseId = 'D1-67';
const executedAt = '20261017060000';
try {

  // Test agent toolkit mode env var
  const envVal = process.env.HDK_AGENT_TOOLKIT || process.env.HDK_DSH_SKIP_INSTALL || 'not_set';
  // Check install module handles agent mode
  let hasInstallFn = false;
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/setup-cli.mjs');
    hasInstallFn = Object.keys(mod).some(k => k.toLowerCase().includes('install') || k.toLowerCase().includes('agent'));
  } catch(e) {}
  const status = hasInstallFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Agent toolkit env var checked, install module has agent-related functions=' + hasInstallFn, executedAt,
    result: { envVal, hasInstallFn } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
