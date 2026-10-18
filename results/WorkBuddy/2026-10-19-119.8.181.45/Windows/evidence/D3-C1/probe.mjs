import { writeFileSync, existsSync } from 'node:fs';
const caseId = 'D3-C1';
const executedAt = '20261019051558';
try {
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credExists = existsSync(credPath);
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasCallTool = mod && typeof mod.callTool === 'function';
  const status = (credExists && hasCallTool) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'credExists=' + credExists + ' callTool=' + !!hasCallTool, executedAt, result: { credExists, hasCallTool, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
