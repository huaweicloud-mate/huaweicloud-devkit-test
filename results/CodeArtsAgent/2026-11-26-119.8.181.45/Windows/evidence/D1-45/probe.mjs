// Real probe for D1-45: ?????????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d145');
  const t = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_check_update', arguments: {} } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: { vendorConfirmed: VC_QUOTE } } },
  ], 60000);
  const r2 = (t.responses.find((x) => x.id === 2) || {}).result || {};
  const r3 = (t.responses.find((x) => x.id === 3) || {}).result || {};
  const txt2 = (r2.content || []).map((c) => c.text).join('');
  const txt3 = (r3.content || []).map((c) => c.text).join('');
  const checkCarries = /_updateInfo/.test(txt2);
  const ok = !checkCarries && !!txt3;
  return { status: ok ? 'PASS' : 'FAIL', why: '??????_updateInfo=' + checkCarries + '?????????=' + !!txt3 + '?????? check_failed ????????', result: { checkText: txt2.slice(0, 400), laterText: txt3.slice(0, 300) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
