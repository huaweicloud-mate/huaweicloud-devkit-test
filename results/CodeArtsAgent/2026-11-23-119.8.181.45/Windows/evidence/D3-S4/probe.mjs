// Real probe for D3-S4: 场景-领券闭环
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const st = await mcpTool('huaweicloud_voucher_status', {}, 60000, ENV);
  const p = st.parsed || {};
  const cl = await mcpTool('huaweicloud_voucher_claim', { vendorConfirmed: VC_QUOTE }, 90000, ENV);
  const c = cl.parsed || {};
  const rateLimited = /HDKIT_CRED_RATE_LIMIT|限额|rate/i.test(JSON.stringify(c) + cl.text);
  const ok = st.ok && (typeof p.claimed === 'boolean' || /claimed|status/i.test(JSON.stringify(p))) && (c.claimed === true || c.status === 'claimed');
  if (ok) return { status: 'PASS', why: 'voucher_status 可读；claim 返回 claimed=true voucherId=' + c.voucherId, result: { status: p, claim: c } };
  return { status: 'BLOCKED', why: 'voucher_status ok=' + st.ok + ' 可读；claim 返回 ' + (rateLimited ? 'AK 调用限额 HDKIT_CRED_RATE_LIMIT（服务端限流）' : JSON.stringify(c).slice(0, 200)) + '；影响：领券闭环不可完成；解除条件：等限额窗口恢复后重测', result: { status: p, claim: c } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
