import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D2-1';
const executedAt = '20261017060000';
try {

  // Test auth init - check credentials.json exists and auth module loads
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credExists = existsSync(credPath);
  let authMod = null;
  try {
    authMod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
  } catch(e) {}
  const hasAuthFns = authMod && Object.keys(authMod).some(k => k.includes('init') || k.includes('load') || k.includes('read'));
  const status = (credExists && hasAuthFns) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: status === 'PASS' ? 'Credentials file exists and auth module has init/load functions' : 'Missing credentials or auth module', executedAt,
    result: { credExists, hasAuthFns, exportedKeys: authMod ? Object.keys(authMod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
