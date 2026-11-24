// Real probe for D4-14: 操作可审计性(CTS真查)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = hc(['CTS', 'ListTraces', '--limit=20']);
  const traces = (r.parsed && (r.parsed.traces || r.parsed.trace_list)) || [];
  const hasIdentity = traces.length > 0 && traces.some((t) => t.user && (t.user.name || t.user.id));
  if (traces.length > 0) return { status: hasIdentity ? 'PASS' : 'FAIL', why: 'CTS ListTraces rc=' + r.rc + ' traces=' + traces.length + ' 含身份字段=' + hasIdentity, result: { count: traces.length, sample: traces.slice(0, 5) } };
  return { status: 'BLOCKED', why: '实测 ' + ts() + ' hcloud CTS ListTraces rc=' + r.rc + ' traces=0（CTS 未启用/无可见审计轨迹）；影响：无法验证 KooCLI 调用审计与身份区分；解除条件：为账号开启 CTS 并授予查询权限', result: { rc: r.rc, out: r.out.slice(0, 600) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
