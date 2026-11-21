// Real probe for D4-14: 操作可审计性
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = runHcloud(['CTS', 'ListTraces', '--cli-region=cn-north-4', '--limit=10']);
  const traces = (r.parsed && r.parsed.traces) || [];
  const hasTime = traces.length === 0 ? false : traces.every((t) => t.time || t.request_time);
  const ok = r.status === 0 && traces.length > 0 && hasTime;
  return { status: ok ? 'PASS' : 'FAIL', why: 'CTS 查询 rc=' + r.status + ' 轨迹数=' + traces.length + ' 每条含时间=' + hasTime + (r.status !== 0 ? ' 错误=' + ((r.stderr || '') + (r.stdout || '')).slice(0, 200) : ''), result: { count: traces.length, sample: traces.slice(0, 3), raw: (r.stdout || '').slice(0, 400) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
