// Real probe for D4-8: Python/Node 策略一致
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join, spawnSyncPy } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const py = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.py';
  const mjs = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.mjs';
  const cmds = ['hcloud ECS DeleteServers --server_id=x', 'hcloud ECS ListServersDetails', 'type C://Users//Administrator//.hcloud//config.json'];
  const out = [];
  for (const c of cmds) {
    const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } });
    const n = runNode(mjs, [], 30000, null, input);
    const p = spawnSyncPy(py, input);
    const nd = /permissionDecision"\s*:\s*"deny"/.test(n.stdout) ? 'deny' : 'allow';
    const pd = /permissionDecision"\s*:\s*"deny"/.test(p) ? 'deny' : 'allow';
    out.push({ cmd: c, node: nd, python: pd, same: nd === pd });
  }
  const ok = out.every((x) => x.same);
  return { status: ok ? 'PASS' : 'FAIL', why: '三条命令双路径判定：' + out.map((x) => x.node + '/' + x.python).join(', '), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
