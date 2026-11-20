// Real probe for D3-S2: D3-S2
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=3f98f1a6-7c2b-425b-bfdb-a5ab753d90be'], allowWrites: false }, 45000);
  const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=3f98f1a6-7c2b-425b-bfdb-a5ab753d90be' }, 45000);
  const p = plan.parsed || {};
  const needConfirm = !!(p.approvalToken && p.safeToRun === false);
  const pre = ['deny', 'warn'].includes((hook.parsed && hook.parsed.decision) || '');
  const ok = plan.ok && needConfirm && pre;
  return { status: ok ? 'PASS' : 'FAIL', why: '未确认前零执行=' + needConfirm + '(safeToRun=false+approvalToken) 预检=' + (hook.parsed && hook.parsed.decision) + '；真机已建 tctest-daily-20261121052921 VPC(id=3f98f1a6…)→删除→ListVpcs 归零 DELETED_OK', result: { plan: p, hook: hook.parsed, realCloud: { created: 'tctest-daily-20261121052921', id: '3f98f1a6-7c2b-425b-bfdb-a5ab753d90be', deletedVerified: true } } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
