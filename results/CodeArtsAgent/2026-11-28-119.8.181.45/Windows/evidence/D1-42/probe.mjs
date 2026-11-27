// Real probe for D1-42: dismiss 冷却期 3 天与二次查询
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const uc = await import('file:///' + (await import('./lib.mjs')).DIST + '/update-check.mjs');
  const h = iso('d142');
  const file = join(h, 'skip-state.json');
  uc.writeSkipState(file, '1.1.15', { at: Date.now() - 1000, days: 3 });
  const st = uc.readSkipState(file);
  const r1 = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, st);
  const r2 = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, st);
  const delta = st ? new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime() : null;
  const ok = delta === 3 * 86400000 && r1.result === 'dismissed' && !!r1.dismissExpiresAt && r2.result === 'dismissed';
  return { status: ok ? 'PASS' : 'FAIL', why: '冷却差=' + delta + '(期望259200000) 首次=' + r1.result + ' 二次=' + r2.result, result: { state: st, first: r1, second: r2, delta } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
