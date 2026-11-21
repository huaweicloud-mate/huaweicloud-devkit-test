// Real probe for D3-S2: 场景-删 VPC 先确认
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const cr = hc(['VPC', 'CreateVpc', '--vpc.name=' + nm, '--vpc.cidr=192.168.0.0/16']);
  const vpc = cr.parsed && cr.parsed.vpc;
  if (!vpc || !vpc.id) return { status: 'FAIL', why: '真机创建 VPC 失败 rc=' + cr.status + ' ' + ((cr.stdout || '') + (cr.stderr || '')).slice(0, 300), result: { raw: (cr.stdout || '').slice(0, 400) } };
  const vid = vpc.id;
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '删除一个VPC' }, 45000);
  const catHit = /vpc/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=' + vid], allowWrites: false }, 45000);
  const p = plan.parsed || {};
  const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=' + vid }, 45000);
  const needConfirm = !!(p.approvalToken && p.safeToRun === false);
  const preDeny = ['deny', 'warn'].includes((hook.parsed && hook.parsed.decision) || '');
  const before = hc(['VPC', 'ListVpcs']);
  const existed = !!vid;
  const del = hc(['VPC', 'DeleteVpc', '--vpc_id=' + vid]);
  const after = hc(['VPC', 'ListVpcs']);
  const remain = ((after.parsed && after.parsed.vpcs) || []).some((v) => v.id === vid);
  const ok = catHit && needConfirm && preDeny && existed && del.status === 0 && !remain;
  return { status: ok ? 'PASS' : 'FAIL', why: '真机建 VPC ' + nm + '(id=' + vid + ') 路由命中=' + catHit + ' 未确认零执行=' + needConfirm + ' 预检=' + (hook.parsed && hook.parsed.decision) + ' 创建返回id=' + existed + ' 删除rc=' + del.status + ' ListVpcs 归零=' + (!remain), result: { vpcId: vid, catalog: cat.parsed, plan: p, hook: hook.parsed, deleted: del.status, remain } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
