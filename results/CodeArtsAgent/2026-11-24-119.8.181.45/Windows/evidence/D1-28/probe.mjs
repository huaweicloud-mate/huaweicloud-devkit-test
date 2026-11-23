// Real probe for D1-28: ????-????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const r = uc.judgeUpdate('1.1.2', { latest: '1.1.14', next: null }, null);
  const ok = r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === '1.1.14';
  return { status: ok ? 'PASS' : 'FAIL', why: 'result=' + r.result + ' targetVersion=' + r.targetVersion, result: r };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
