import { writeFileSync } from 'node:fs';
// D1-41: check_update real MCP return contract — four states via callTool
const caseId = 'D1-41';
const executedAt = '20261017061400';
try {
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  // Call check_update via callTool
  const result = await callTool('huaweicloud_check_update', {});
  // Verify return contract: content with JSON, isError=false, fields present
  const isError = result?.isError === true;
  const content = result?.content;
  let parsed = null;
  if (Array.isArray(content) && content[0]?.text) {
    try { parsed = JSON.parse(content[0].text); } catch {}
  } else if (typeof result === 'object') {
    parsed = result;
  }
  const hasFields = parsed && (parsed.result || parsed.currentVersion !== undefined || parsed.updateAvailable !== undefined);
  const status = (!isError && hasFields) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'check_update MCP call: isError=' + isError + ', hasFields=' + !!hasFields + ', result=' + (parsed?.result || 'unknown'), executedAt, result: { isError, parsed, hasFields } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
