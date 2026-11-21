// Real probe for D1-69: CLI help ???
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = runCli(['help'], 60000);
  const ok = r.status === 0 && /Commands:/.test(r.stdout) && /install/.test(r.stdout) && /doctor/.test(r.stdout);
  return { status: ok ? 'PASS' : 'FAIL', why: 'exit=' + r.status + ' ?????=' + /Commands:/.test(r.stdout), result: { head: r.stdout.slice(0, 800) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
