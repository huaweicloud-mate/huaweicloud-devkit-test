// Real probe for D9-4: 协议生命周期
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, init, rawSession, parseFrames } from '../../_runner/lib.mjs';
const run = async () => {
  const good = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 45000);
  const okStd = !!(good.responses.find((r) => r.id === 2) || {}).result;
  const bad = await rawSession([{ jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} }], 15000);
  const badResp = parseFrames(bad).find((x) => x.id === 9);
  const rejected = !!(badResp && badResp.error && badResp.error.code === -32600);
  const ok = okStd && rejected;
  return { status: ok ? 'PASS' : 'FAIL', why: '标准时序正常=' + okStd + ' 非法时序被拒(-32600)=' + rejected, result: { standard: okStd, illegal: badResp } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
