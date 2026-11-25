// Real probe for D4-20: 拒绝后零操作
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 45000);
  const token = plan.parsed && plan.parsed.approvalToken;
  const rej = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'reject' }, 45000);
  const again = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
  const rejText = JSON.stringify(rej.parsed || {}) + (rej.text || '');
  const againText = JSON.stringify(again.parsed || {}) + (again.text || '');
  const rejected = /reject|denied|cancel/i.test(rejText);
  const noReplay = /invalid|expired|already|reject/i.test(againText) || !/approved/.test(againText);
  const ok = !!token && rejected && noReplay;
  return { status: ok ? 'PASS' : 'FAIL', why: '拒绝=' + rejected + ' 拒绝后不可再批准=' + noReplay, result: { reject: rej.parsed || rej.text, again: again.parsed || again.text } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
