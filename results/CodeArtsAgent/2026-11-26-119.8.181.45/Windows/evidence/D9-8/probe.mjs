// Real probe for D9-8: inputSchema 版本合规
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join, init } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
  const tools = ((s.responses.find((r) => r.id === 2) || {}).result || {}).tools || [];
  const bad = tools.filter((t) => t.inputSchema && t.inputSchema.$schema && !/2020-12|draft-07/.test(t.inputSchema.$schema));
  const mixed = new Set(tools.map((t) => t.inputSchema && t.inputSchema.$schema || 'none'));
  const ok = tools.length >= 40 && bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: 'schema $schema 取值集合=' + [...mixed].join(',') + ' 非法=' + bad.length, result: { count: tools.length, schemes: [...mixed], bad: bad.map((x) => x.name) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
