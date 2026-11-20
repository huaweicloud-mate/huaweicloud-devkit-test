// Real probe for D4-25: Python hook 事件遥测分类
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const ev = HOME + '/.workbuddy/huaweicloud-plugins/telemetry/hook-events.jsonl';
  const before = existsSync(ev) ? readFileSync(ev, 'utf8').split('\n').filter(Boolean).length : 0;
  const cmds = ['hcloud ECS ListServersDetails', 'hcloud ECS DeleteServers --server_id=x', 'echo hello'];
  for (const c of cmds) runPy(JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } }));
  const lines = existsSync(ev) ? readFileSync(ev, 'utf8').split('\n').filter(Boolean) : [];
  const tail = lines.slice(before).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const caps = tail.map((e) => e.capability || e.value || '');
  const ok = caps.includes('cli:read') && caps.includes('cli:write') && caps.includes('cli:invoke');
  return { status: ok ? 'PASS' : 'FAIL', why: '新增事件=' + tail.length + ' 分类=' + caps.join(','), result: { path: ev, events: tail.slice(-6) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
