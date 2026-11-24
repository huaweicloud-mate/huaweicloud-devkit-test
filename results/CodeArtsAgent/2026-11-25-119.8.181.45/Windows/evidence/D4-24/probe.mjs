// Real probe for D4-24: 确认令牌过期与重复确认
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 45000);
  const token = plan.parsed && plan.parsed.approvalToken;
  const c1 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
  const c2 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
  const fake = await mcpTool('huaweicloud_auth_confirm', { token: 'EXPIRED-OR-INVALID-TOKEN', decision: 'approve' }, 45000);
  const t2 = (JSON.stringify(c2.parsed || {}) + (c2.text || ''));
  const tf = (JSON.stringify(fake.parsed || {}) + (fake.text || ''));
  const replayBlocked = /already|processed|invalid|expired|reject/i.test(t2) || !/approved/.test(t2);
  const invalidBlocked = /invalid|expired|reject|error/i.test(tf);
  const ok = !!token && replayBlocked && invalidBlocked;
  return { status: ok ? 'PASS' : 'FAIL', why: '首次确认=' + JSON.stringify(c1.parsed || {}).slice(0, 60) + ' 重复确认已拒绝=' + replayBlocked + ' 无效令牌拒绝=' + invalidBlocked, result: { first: c1.parsed || c1.text, second: c2.parsed || c2.text, fake: fake.parsed || fake.text } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
