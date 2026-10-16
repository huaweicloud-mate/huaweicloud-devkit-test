import { writeFileSync } from 'node:fs';
const caseId = 'D5-3';
const executedAt = '20261017060000';
try {

  // Tool enumeration via MCP server
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'); } catch(e) {}
  const hasToolList = mod && Object.keys(mod).some(k => k.includes('tool') || k.includes('list'));
  const status = hasToolList ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'MCP server has tool listing functions=' + hasToolList, executedAt,
    result: { hasToolList, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
