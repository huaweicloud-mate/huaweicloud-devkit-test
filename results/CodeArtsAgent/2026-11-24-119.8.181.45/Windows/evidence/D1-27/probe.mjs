// Real probe for D1-27: ????-????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const r = uc.judgeUpdate('1.1.14', { latest: '1.1.14', next: null }, null);
  const ok = r.result === 'up_to_date' && r.updateAvailable === false;
  return { status: ok ? 'PASS' : 'FAIL', why: 'result=' + r.result + ' updateAvailable=' + r.updateAvailable, result: r };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
