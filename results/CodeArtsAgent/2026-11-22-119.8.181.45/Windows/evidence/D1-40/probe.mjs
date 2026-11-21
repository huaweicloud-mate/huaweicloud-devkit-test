// Real probe for D1-40: ?? lag ??????(??????)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const uc = await import('file:///' + DIST + '/update-check.mjs');
    const older = uc.judgeUpdate('1.1.14', { latest: '1.1.13', next: null }, null);
    const newer = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, null);
    const same = uc.judgeUpdate('1.1.14', { latest: '1.1.14', next: null }, null);
    const ok = older.updateAvailable === false && same.updateAvailable === false && newer.updateAvailable === true;
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '??<=?????????>??????????????' : 'judgeUpdate ????', result: { older, same, newer } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
