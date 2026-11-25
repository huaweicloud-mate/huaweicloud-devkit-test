// Real probe for D1-26: ?????????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ], 20000);
  const list = (((r.responses.find((x) => x.id === 2) || {}).result || {}).tools || []);
  const cu = list.find((t) => t.name === 'huaweicloud_check_update');
  const up = list.find((t) => t.name === 'huaweicloud_upgrade');
  const ok = !!cu && !!up && !!cu.description && !!cu.inputSchema && !!up.description && !!up.inputSchema;
  return { status: ok ? 'PASS' : 'FAIL', why: 'check_update??=' + !!cu + ' upgrade??=' + !!up + ' schema??=' + (!!(cu && cu.inputSchema) && !!(up && up.inputSchema)), result: { checkUpdate: cu, upgrade: up } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
