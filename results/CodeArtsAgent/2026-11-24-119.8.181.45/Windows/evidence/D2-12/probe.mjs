// Real probe for D2-12: R10 runtime 凭证抑制落盘
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d212');
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  const sess = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_auth_switch', arguments: { vendorConfirmed: VC_QUOTE, mode: 'memory', action: 'temporary', ak: 'AKTESTD21200000000', sk: 'SKTESTD2120000000000000000000000000', region: 'cn-north-4' } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_sync', arguments: { target: 'all' } } },
  ], 60000, { USERPROFILE: h, HOME: h });
  const f2 = finishCall(sess.responses.find((r) => r.id === 2));
  const f3 = finishCall(sess.responses.find((r) => r.id === 3));
  const txt = (f3.text || '') + JSON.stringify(f3.parsed || {});
  const suppressed = /suppress|R10|runtime/i.test(txt);
  const ok = suppressed && !existsSync(s1);
  return { status: ok ? 'PASS' : 'FAIL', why: 'auth_switch=' + (f2.text || '').slice(0, 100) + '；auth_sync=' + txt.slice(0, 220) + '；S1落盘=' + existsSync(s1), result: { switchResp: f2.parsed || f2.text, syncResp: f3.parsed || f3.text, s1Exists: existsSync(s1) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
