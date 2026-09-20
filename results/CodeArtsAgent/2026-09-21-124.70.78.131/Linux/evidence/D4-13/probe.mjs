// D4-13 最小权限凭证通过率（只读子账号 test001 真机验证）
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const REGION = process.env.HW_REGION || 'cn-north-4';
const SRC = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
function sh(args) { const r = spawnSync('hcloud', args, { encoding: 'utf8' }); return (r.stdout||'') + (r.stderr||''); }
const vpcName = `ro-probe-${String(Date.now()).slice(-8)}`;
const args = ['VPC','CreateVpc',`--vpc.name=${vpcName}`,'--vpc.cidr=10.98.0.0/16',`--cli-region=${REGION}`];
// 只读 ListVpcs
const ro = await callTool('huaweicloud_plan_cli_command', { args: ['VPC','ListVpcs',`--cli-region=${REGION}`], allowWrites: false });
console.log('只读ListVpcs:', ro.classification?.decision, ro.classification?.risk);
// 写 CreateVpc plan
const plan = await callTool('huaweicloud_plan_cli_command', { args, allowWrites: true });
console.log('写CreateVpc分类:', plan.classification?.decision, plan.classification?.risk, 'token:', !!plan.approvalToken);
// run_approved 用完全一致的 args
let runRes;
try { runRes = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true }); }
catch (e) { runRes = { __err: String(e).slice(0,200) }; }
const txt = JSON.stringify(runRes);
console.log('run_approved结果:', txt.slice(0,500));
const denied = /403|not authorized|AccessDenied|权限不足|forbidden|denied|Insufficient|PolicyNotAllow/i.test(txt);
const idm = /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(txt);
console.log('写被IAM拒绝:', denied, '| 创建返回vpc.id:', idm?.[1] || '无');
// 归零：若创建成功（权限过宽），删除本次创建的 VPC
if (idm?.[1]) {
  const del = sh(['VPC','DeleteVpc',`--vpc_id=${idm[1]}`,`--cli-region=${REGION}`]);
  console.log('归零DeleteVpc:', del.slice(0,120));
  const lv = sh(['VPC','ListVpcs',`--cli-region=${REGION}`]);
  console.log('归零验证ListVpcs(应无本次vpc):', lv.includes(vpcName) ? '仍有残留!' : '无本次创建(归零OK)');
}
console.log('===D4-13 DONE===');
