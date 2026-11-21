// Real probe for D3-B1: list_operations 规范名
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const out = [];
  for (const svc of ['ECS', 'VPC', 'OBS']) { const r = await mcpTool('huaweicloud_list_operations', { service: svc }, 60000); out.push({ svc, ok: r.ok, len: (r.text || '').length, head: (r.text || '').slice(0, 160) }); }
  const ok = out.every((x) => x.ok && x.len > 50);
  return { status: ok ? 'PASS' : 'FAIL', why: out.map((x) => x.svc + '=' + x.ok + '(' + x.len + ')').join(' '), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
