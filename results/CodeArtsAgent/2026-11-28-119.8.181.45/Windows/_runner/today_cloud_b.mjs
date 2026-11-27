import { mcpTool, runHcloud, writeEvidence, writeProbe, VC_QUOTE } from './lib.mjs';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const ts14 = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
const nm = 'tctest-daily-' + ts14;
const hc = (a) => runHcloud([...a, '--cli-profile=deploy'], 240000);
const cases = [];
cases.push({ id: 'D3-S2', title: '场景-删 VPC 先确认', fn: async () => {
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
} });
cases.push({ id: 'D4-13', title: '最小权限凭证通过率', fn: async () => {
  const roCred = JSON.parse(readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.readonly.json', 'utf8'));
  const roList = spawnSync('hcloud', ['ECS', 'ListServersDetails', '--cli-profile=rotest'], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  const roOk = roList.status === 0 && /servers|count/i.test(roList.stdout);
  const roWriteName = 'tctest-ro-' + Date.now().toString().slice(-8);
  const roWrite = spawnSync('hcloud', ['VPC', 'CreateVpc', '--vpc.name=' + roWriteName, '--vpc.cidr=10.99.0.0/16', '--cli-profile=rotest'], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  const wo = (roWrite.stdout || '') + (roWrite.stderr || '');
  const denied = /PolicyNotAuthorized|VPC\.0010|权限不足|disallowed by policy|403/i.test(wo);
  let leaked = null;
  try { const j = JSON.parse(roWrite.stdout || '{}'); leaked = j && j.vpc && j.vpc.id; } catch {}
  let cleaned = true;
  if (leaked) { hc(['VPC', 'DeleteVpc', '--vpc_id=' + leaked]); const l = hc(['VPC', 'ListVpcs']); cleaned = !((l.parsed && l.parsed.vpcs) || []).some((v) => v.id === leaked); }
  const ok = roOk && denied && cleaned;
  return { status: ok ? 'PASS' : 'FAIL', why: '只读子账号(' + roCred.ak.slice(0, 6) + '...): 只读清单成功=' + roOk + '；写 VPC 被 IAM 拒绝=' + denied + '；误建资源=' + (leaked || '无') + ' 清理归零=' + cleaned, result: { roStatus: roList.status, roOut: roList.stdout.slice(0, 200), writeStatus: roWrite.status, writeOut: wo.slice(0, 500), leaked, cleaned } };
} });
for (const c of cases) {
  let r; try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; }
  writeEvidence(c.id, r); try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status.padEnd(6), '|', String(r.why || '').slice(0, 240));
}