// Real probe for D9-3: tools/call 响应格式
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, init } from '../../_runner/lib.mjs';
const run = async () => {
  const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } }, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_run_readonly_command', arguments: {} } }], 60000);
  const r2 = s.responses.find((r) => r.id === 2) || {};
  const r3 = s.responses.find((r) => r.id === 3) || {};
  const okSuccess = !!(r2.result && Array.isArray(r2.result.content));
  const okFail = !!(r3.result && (r3.result.isError === true || r3.error)) || !!(r3.error);
  const ok = okSuccess && okFail;
  return { status: ok ? 'PASS' : 'FAIL', why: '成功 content数组=' + okSuccess + ' 失败 isError/错误=' + okFail, result: { success: r2.result && { hasContent: Array.isArray(r2.result.content), isError: r2.result.isError }, fail: r3.result || r3.error } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
