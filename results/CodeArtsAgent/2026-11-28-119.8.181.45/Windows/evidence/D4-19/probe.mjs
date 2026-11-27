// Real probe for D4-19: ?????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 60000);
    const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=abc' }, 45000);
    const art = await mcpTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'policy.json', content: JSON.stringify({ Version: '1.1', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }) }] }, 45000);
    const ok = (plan.parsed && plan.parsed.userConfirmation && plan.parsed.userConfirmation.needed === true)
      && (hook.parsed && ['deny', 'warn'].includes(hook.parsed.decision))
      && (art.parsed && art.parsed.decision === 'deny');
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '?????????/??????' : '?????', result: { plan: plan.parsed, hook: hook.parsed, art: art.parsed } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
