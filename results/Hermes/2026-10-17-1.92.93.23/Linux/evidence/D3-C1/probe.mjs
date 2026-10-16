// D3-C1 ECS 生命周期 E2E（Hermes Linux daily 2026-10-17）
// 断言：插件引导全程完成，无残留 —— 最小 VPC → 子网(ECS 前置) → ECS 读 → 删除归零。真机执行。
import { pathToFileURL } from 'node:url';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);
const REGION = 'cn-north-4';
const ts = Date.now().toString(36);
const vpcName = `tctest-hermes-c1-${ts}`;
const results = [];
function rec(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); console.log(`[${pass ? 'OK' : 'FAIL'}] ${name} | ${String(detail).slice(0, 160)}`); }
const call = async (n, a) => callTool(n, a).catch((e) => ({ isError: true, error: e.message }));

// 1. CreateVpc (plan + approved)
const ca = ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.0.0/16'];
let vpcId = '';
{
  const cp = await call('huaweicloud_plan_cli_command', { args: ca, allowWrites: true });
  const cr = await call('huaweicloud_run_approved_command', { args: ca, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  vpcId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(cr.stdout || '') || [])[1] || '';
  rec('CreateVpc', cr.ok === true && !!vpcId, 'vpcId=' + (vpcId || '(空)') + ' err=' + (cr.stdout || cr.error || '').slice(0, 120));
}

// 2. CreateSubnet (plan + approved)
let subnetId = '';
if (vpcId) {
  const sa = ['VPC', 'CreateSubnet', '--cli-region=' + REGION, '--vpc_id=' + vpcId, '--name=' + vpcName + '-sub', '--cidr=192.168.1.0/24', '--gateway_ip=192.168.1.1'];
  const sp = await call('huaweicloud_plan_cli_command', { args: sa, allowWrites: true });
  const sr = await call('huaweicloud_run_approved_command', { args: sa, approvalToken: sp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  subnetId = (/"id"\s*:\s*"([0-9a-f-]{36})"/.exec(sr.stdout || '') || [])[1] || '';
  rec('CreateSubnet', sr.ok === true && !!subnetId, 'subnetId=' + (subnetId || '(空)') + ' err=' + (sr.stdout || sr.error || '').slice(0, 120));
}

// 3. ECS 只读查询（插件引导的查询环节）
{
  const r = await call('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  rec('ListServersDetails(只读)', r.ok === true || /count|servers/i.test(r.stdout || ''), (r.stdout || '').slice(0, 120));
}

// 4. 归零：删除子网 + VPC（只删本次创建）
if (subnetId) {
  const da = ['VPC', 'DeleteSubnet', '--cli-region=' + REGION, '--subnet_id=' + subnetId];
  const dp = await call('huaweicloud_plan_cli_command', { args: da, allowWrites: true });
  const dr = await call('huaweicloud_run_approved_command', { args: da, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  rec('DeleteSubnet', dr.ok === true, dr.ok);
}
if (vpcId) {
  const va = ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId];
  const vp = await call('huaweicloud_plan_cli_command', { args: va, allowWrites: true });
  const vr = await call('huaweicloud_run_approved_command', { args: va, approvalToken: vp.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  rec('DeleteVpc', vr.ok === true, vr.ok);
}

// 5. 归零验证
{
  const r = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  const containsOwn = (r.stdout || '').includes(vpcId);
  rec('归零验证(不含本次资源)', !containsOwn, containsOwn ? '仍含本次 VPC' : '已归零');
}

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
const status = (vpcId && subnetId && failed === 0) ? 'PASS' : (vpcId ? 'FAIL' : 'BLOCKED');
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C1', status, total: results.length, passed, failed, results }, null, 2));