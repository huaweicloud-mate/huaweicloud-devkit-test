// Real probe for D4-9: ????/?????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const pub = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC CreateSecurityGroupRule --security_group_rule.remote_ip_prefix=0.0.0.0/0 --security_group_rule.direction=ingress' }, 45000);
    const plan = await mcpTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', auth: 'none', cleanup: false, resources: [{ type: 'FunctionGraph', name: 'fn1' }] } }, 45000);
    const del = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud RDS DeleteInstance --instance_id=x' }, 45000);
    const dv = (x) => (x.parsed && x.parsed.decision) || '';
    const ok = ['deny', 'warn'].includes(dv(pub)) && ['deny', 'warn'].includes(dv(plan)) && ['deny', 'warn'].includes(dv(del));
    return { status: ok ? 'PASS' : 'FAIL', why: 'publicSG=' + dv(pub) + ' deployPlan=' + dv(plan) + ' destructive=' + dv(del), result: { pub: pub.parsed, plan: plan.parsed, del: del.parsed } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
