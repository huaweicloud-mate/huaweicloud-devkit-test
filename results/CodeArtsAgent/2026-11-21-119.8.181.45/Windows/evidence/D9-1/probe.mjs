// Real probe for D9-1: tools/list 合规
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
  const tl = s.responses.find((r) => r.id === 2) || {};
  const tools = (tl.result && tl.result.tools) || [];
  const bad = tools.filter((t) => !t.name || !t.inputSchema || t.inputSchema.type !== 'object' || !t.description);
  const dup = tools.length - new Set(tools.map((t) => t.name)).size;
  const ok = tools.length >= 40 && bad.length === 0 && dup === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '工具=' + tools.length + ' schema非法=' + bad.length + ' 重复=' + dup, result: { count: tools.length, bad: bad.map((x) => x.name), dup } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
