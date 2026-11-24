// Real probe for D9-7: 协议版本协商降级
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const s = await mcpSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-06-18', capabilities: {}, clientInfo: { name: 'old', version: '1' } } }], 30000);
  const r = s.responses.find((x) => x.id === 1) || {};
  const ver = r.result && r.result.protocolVersion;
  const ok = !!ver && (ver === '2024-11-05' || ver === '2024-06-18' || !!r.error);
  return { status: ok ? 'PASS' : 'FAIL', why: '旧版本客户端协商返回 protocolVersion=' + ver + ' 或明确错误=' + !!r.error, result: r };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
