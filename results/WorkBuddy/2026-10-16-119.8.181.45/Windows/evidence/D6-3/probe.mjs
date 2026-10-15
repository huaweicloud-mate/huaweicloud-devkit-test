import { writeFileSync } from 'node:fs';
const caseId = 'D6-3';
const executedAt = '20261016050729';
try {

  // MCP cold start time
  const startTime = Date.now();
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'); } catch(e) {}
  const coldStartMs = Date.now() - startTime;
  const status = (mod && coldStartMs < 5000) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'MCP cold start=' + coldStartMs + 'ms, module loaded=' + !!mod, executedAt,
    result: { coldStartMs, loaded: !!mod } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
