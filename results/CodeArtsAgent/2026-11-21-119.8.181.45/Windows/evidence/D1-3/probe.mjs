// Real probe for D1-3: doctor 健康自检
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r1 = runCli(['doctor'], 240000);
  const passCount = (r1.stdout.match(/\[PASS\]/g) || []).length;
  const failCount = (r1.stdout.match(/\[(WARN|FAIL)\]/g) || []).length;
  const ok = r1.status === 0 && passCount >= 5 && (failCount > 0 ? /re-run:/.test(r1.stdout) : true);
  return { status: ok ? 'PASS' : 'FAIL', why: 'doctor exit=' + r1.status + '，PASS 项=' + passCount + '，WARN/FAIL=' + failCount + '，全通过时无需修复指引', result: { passCount, failCount, sample: r1.stdout.slice(0, 1200) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
