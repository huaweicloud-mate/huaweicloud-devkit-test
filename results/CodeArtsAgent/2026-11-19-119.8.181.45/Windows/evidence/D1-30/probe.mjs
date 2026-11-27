// Real probe for D1-30: semver 比对正确性
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const vs = await import('file:///' + DIST + '/update-semver.js');
  const pairs = [['1.1.2', '1.1.1', 1], ['1.1.0', '1.1.0-next.9', 1], ['1.1.0', '1.1.0', 0], ['1.1.1', '1.1.2', -1]];
  const out = pairs.map(([a, b, want]) => ({ a, b, got: vs.semverCompare(a, b), want, ok: vs.semverCompare(a, b) === want }));
  const ok = out.every((x) => x.ok);
  return { status: ok ? 'PASS' : 'FAIL', why: out.map((x) => x.a + ' vs ' + x.b + '=' + x.got).join('；'), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
