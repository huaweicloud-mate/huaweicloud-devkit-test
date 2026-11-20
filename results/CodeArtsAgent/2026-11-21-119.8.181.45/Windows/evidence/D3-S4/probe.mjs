// Real probe for D3-S4: 场景-领券闭环
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const s1 = await mcpTool('huaweicloud_voucher_status', {}, 45000);
  const p1 = s1.parsed || {};
  const before = p1.claimed;
  const claim = await mcpTool('huaweicloud_voucher_claim', {}, 60000);
  const cp = claim.parsed || {};
  const s2 = await mcpTool('huaweicloud_voucher_status', {}, 45000);
  const p2 = s2.parsed || {};
  const after = p2.claimed;
  const ok = s1.ok && s2.ok && (claim.ok || /already|claimed|领取/i.test(JSON.stringify(cp))) && (before === false ? after === true : after === true);
  return { status: ok ? 'PASS' : 'FAIL', why: 'status.claimed: ' + before + ' -> ' + after + '；claim 返回=' + JSON.stringify(cp).slice(0, 200), result: { before: p1, claim: cp, after: p2 } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
