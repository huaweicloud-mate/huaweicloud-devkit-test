// Real probe for D8-7: 7 个 meta/通用技能指引可机械执行
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const names = ['huawei-getting-started', 'huawei-ecs', 'huawei-iac', 'huaweicloud-cli-and-auth', 'huaweicloud-safety', 'huaweicloud-capability-discovery', 'huaweicloud-troubleshooting'];
  const msgs = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }];
  names.forEach((n, i) => msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_retrieve_skill', arguments: { name: n } } }));
  const sess = await mcpSession(msgs, 150000);
  const loaded = names.map((n, i) => { const f = finishCall(sess.responses.find((r) => r.id === i + 2)); return { name: n, ok: !!f.ok, len: (f.text || '').length, head: (f.text || '').slice(0, 100) }; });
  const ok = loaded.every((x) => x.ok && x.len > 500);
  return { status: ok ? 'PASS' : 'FAIL', why: '加载 ' + loaded.filter((x) => x.ok && x.len > 500).length + '/' + loaded.length + ' 个技能：' + loaded.map((x) => x.name + '=' + x.len).join(', '), result: { loaded } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
