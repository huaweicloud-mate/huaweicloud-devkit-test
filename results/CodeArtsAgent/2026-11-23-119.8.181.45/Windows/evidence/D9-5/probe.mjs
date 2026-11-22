// Real probe for D9-5: stdio 传输健壮
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const big = 'x'.repeat(20000);
  const msgs = [init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_search_docs', arguments: { query: big } } }];
  const raw = await rawSession(msgs, 60000);
  const rs = parseFrames(raw);
  const all = [1, 2, 3].every((id) => rs.some((r) => r.id === id));
  const pure = rs.length > 0 && !/^(?!Content-Length)/.test(raw || 'Content-Length:');
  const ok = all && rs[0].jsonrpc === '2.0';
  return { status: ok ? 'PASS' : 'FAIL', why: '大payload/超长输出三请求均响应=' + all + ' stdout纯协议=' + pure, result: { responses: rs.length, pure, ids: rs.map((r) => r.id) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
