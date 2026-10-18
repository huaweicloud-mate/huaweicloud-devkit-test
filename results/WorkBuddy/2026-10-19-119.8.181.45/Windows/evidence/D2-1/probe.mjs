import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const caseId = 'D2-1';
const executedAt = '20261019051558';
try {
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credExists = existsSync(credPath);
  let authMod = null;
  try { authMod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs'); } catch(e) {}
  const hasAuthFns = authMod && Object.keys(authMod).some(k => k.includes('init') || k.includes('read') || k.includes('write'));
  const status = (credExists && hasAuthFns) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'credExists=' + credExists + ' hasAuthFns=' + !!hasAuthFns, executedAt, result: { credExists, hasAuthFns, keys: authMod ? Object.keys(authMod).slice(0,8) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
