// Real probe for D3-S2: 场景-删VPC先确认(真机建删)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const nm = 'tctest-codearts1-' + stamp;
  const vpc = hc(['VPC', 'CreateVpc', '--vpc.name=' + nm, '--vpc.cidr=10.88.0.0/16']);
  const vpcId = vpc.parsed && vpc.parsed.vpc && vpc.parsed.vpc.id;
  if (!vpcId) return { status: 'FAIL', why: '真机创建 VPC 失败 rc=' + vpc.rc + ' ' + vpc.out.slice(0, 200), result: vpc };
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '删除一个VPC' }, 45000);
  const catHit = /vpc/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=' + vpcId], allowWrites: false }, 45000);
  const p = plan.parsed || {};
  const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=' + vpcId }, 45000);
  const needConfirm = !!(p.approvalToken && p.safeToRun === false);
  const preDeny = ['deny', 'warn'].includes((hook.parsed && hook.parsed.decision) || '');
  const del = hc(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId]);
  await sleep(4000);
  const after = hc(['VPC', 'ListVpcs']);
  const remain = ((after.parsed && after.parsed.vpcs) || []).some((v) => v.id === vpcId);
  const ok = catHit && needConfirm && preDeny && del.rc === 0 && !remain;
  return { status: ok ? 'PASS' : 'FAIL', why: '真机建 VPC ' + nm + '(id=' + vpcId + ') 路由命中=' + catHit + ' 未确认零执行=' + needConfirm + ' 预检=' + (hook.parsed && hook.parsed.decision) + ' 删除rc=' + del.rc + ' ListVpcs 归零=' + !remain, result: { vpcId, catalog: cat.parsed, plan: p, hook: hook.parsed, deleted: del.rc, remain, name: nm } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
