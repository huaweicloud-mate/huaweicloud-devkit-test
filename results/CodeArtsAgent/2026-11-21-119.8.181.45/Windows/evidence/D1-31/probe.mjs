// Real probe for D1-31: dismiss 状态持久化
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const uc = await import('file:///' + (await import('./lib.mjs')).DIST + '/update-check.mjs');
  const h = iso('d131');
  const old = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = h;
  const p = uc.resolveSkipFilePath();
  uc.writeSkipState(p, '1.1.15', { days: 3 });
  const back = uc.readSkipState(p);
  const r = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, back);
  if (old === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = old;
  const ok = existsSync(p) && !!back && back.dismissedVersion === '1.1.15' && r.result === 'dismissed' && !!r.dismissExpiresAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skipFile=' + p + ' 落盘=' + existsSync(p) + ' result=' + r.result + ' expiresAt=' + r.dismissExpiresAt, result: { path: p, state: back, judge: r } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
