// Real probe for D3-C7: 跨区域资源操作引导
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails', '--cli-region=cn-south-1'], allowWrites: false }, 45000);
  const av = await mcpTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-south-1' }, 45000);
  const ro = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const cmd = (plan.parsed && plan.parsed.command) || '';
  const ok = cmd.includes('--cli-region') && av.ok && ro.ok;
  return { status: ok ? 'PASS' : 'FAIL', why: 'plan 命令含 --cli-region=' + cmd.includes('--cli-region') + ' 区域可用性=' + av.ok + ' 只读查询=' + ro.ok, result: { command: cmd, availability: av.parsed, readonly: (ro.text || '').slice(0, 300) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
