// Real probe for D9-2: JSON-RPC 错误码
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, init, rawSession, parseFrames, errOf } from '../../_runner/lib.mjs';
const run = async () => {
  const s1 = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'unknown/method', params: {} }], 45000);
  const e1 = errOf(JSON.stringify(s1.responses), 2) || (s1.responses.find((r) => r.id === 2) || {}).error;
  const s2 = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_run_readonly_command', arguments: {} } }], 45000);
  const r2 = s2.responses.find((r) => r.id === 2) || {};
  const badArgs = !!(r2.error && r2.error.code === -32602) || !!(r2.result && r2.result.isError);
  const raw = await rawSession([init, 'Content-Length: 5\r\n\r\n{bad}'], 15000);
  const pe = parseFrames(raw).find((x) => x.error && x.error.code === -32700);
  const ok = e1 && e1.code === -32601 && badArgs;
  return { status: ok ? 'PASS' : 'FAIL', why: '未知方法=' + (e1 && e1.code) + ' 非法参数=' + (r2.error ? r2.error.code : (r2.result && r2.result.isError)) + ' 解析错误=' + (pe ? pe.error.code : '未响应'), result: { unknown: e1, invalidArgs: r2.error || r2.result, parseError: pe && pe.error } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
