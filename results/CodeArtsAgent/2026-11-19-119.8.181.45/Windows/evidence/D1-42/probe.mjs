// Real probe for D1-42: dismiss 真实闭环与跨调用持久化
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d142');
  const first = await mcpTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.14' }, 60000, { USERPROFILE: h, HOME: h });
  const p1 = first.parsed || {};
  const second = await mcpTool('huaweicloud_check_update', {}, 60000, { USERPROFILE: h, HOME: h });
  const p2 = second.parsed || {};
  const sk = await import('file:///' + DIST + '/update-skip.js');
  const st = sk.readSkipState({ home: h });
  const delta = st && st.dismissedAt && st.expireAt ? st.expireAt - st.dismissedAt : null;
  const ok = !!st && delta === 3 * 86400000 && p2.dismissed === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'skip 文件=' + JSON.stringify(st) + '，expireAt-dismissedAt=' + delta + '(应为259200000)，二次查询 dismissed=' + p2.dismissed, result: { first: p1, second: p2, state: st, delta } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
