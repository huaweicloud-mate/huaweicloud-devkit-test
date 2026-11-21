// Real probe for D6-3: MCP 冷启时间
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const t0 = Date.now();
  const s = await timedSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }], 30000);
  const ms = s.arrivals[1] ? s.arrivals[1] - t0 : null;
  const ok = ms !== null && ms < 5000;
  return { status: ok ? 'PASS' : 'FAIL', why: '冷启到 initialize 响应=' + ms + 'ms 阈值5000ms', result: { ms } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
