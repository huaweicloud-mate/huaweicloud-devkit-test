import { writeFileSync } from 'node:fs';
const caseId = 'D3-C6';
const executedAt = '20261017060000';
try {

  // Sandbox 7 implicit tools
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/sandbox/session-manager.mjs'); } catch(e) {}
  const hasSession = mod && Object.keys(mod).length > 0;
  const status = hasSession ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Sandbox session manager module loaded=' + hasSession, executedAt, result: { hasSession, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
