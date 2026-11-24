// Real probe for D9-12: initialize ????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const good = await mcpSession([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } },
    ], 20000);
    const initRes = (good.responses.find((r) => r.id === 1) || {}).result || {};
    const bad = await mcpSession([
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ], 20000);
    const badResp = bad.responses.find((r) => r.id === 2) || {};
    const badCode = badResp.error && badResp.error.code;
    const ok = initRes.protocolVersion === '2024-11-05' && !!initRes.capabilities && !!initRes.serverInfo && (badCode === -32600 || badResp.error);
    return { status: ok ? 'PASS' : 'FAIL', why: 'initialize protocolVersion=' + initRes.protocolVersion + ' serverInfo=' + JSON.stringify(initRes.serverInfo) + '????? error.code=' + badCode, result: { initRes, badResp, badRaw: bad.raw.slice(0, 600) } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
