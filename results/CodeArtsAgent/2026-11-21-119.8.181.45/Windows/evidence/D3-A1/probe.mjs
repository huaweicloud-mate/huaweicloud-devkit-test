// Real probe for D3-A1: skill 检索完整性
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const dir = PKG + '/plugins/huaweicloud-core/skills';
  const names = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const msgs = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }];
  names.forEach((n, i) => msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_retrieve_skill', arguments: { name: n } } }));
  const s = await mcpSession(msgs, 180000);
  const res = names.map((n, i) => { const f = finishCall(s.responses.find((r) => r.id === i + 2)); return { name: n, ok: !!f.ok, len: (f.text || '').length }; });
  const bad = res.filter((x) => !x.ok || x.len < 200);
  const ok = res.length >= 25 && bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skill 数=' + res.length + ' 完整检索=' + (res.length - bad.length) + ' 缺失=' + bad.map((x) => x.name).join(','), result: { total: res.length, bad } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
