// Real probe for D1-3: doctor健康自检
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r1 = runCli(['doctor'], 240000);
  const passCount = (r1.stdout.match(/\[PASS\]/g) || []).length;
  const warnCount = (r1.stdout.match(/\[(WARN|SKIP|FAIL)\]/g) || []).length;
  const hasGuidance = /re-run:/.test(r1.stdout);
  const ok = r1.status === 0 && passCount >= 5 && hasGuidance;
  return { status: ok ? 'PASS' : 'FAIL', why: 'doctor exit=' + r1.status + '，PASS 项 ' + passCount + ' 个，WARN/SKIP ' + warnCount + ' 个，含修复指引=' + hasGuidance, result: { passCount, warnCount, sample: r1.stdout.slice(0, 1200) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
