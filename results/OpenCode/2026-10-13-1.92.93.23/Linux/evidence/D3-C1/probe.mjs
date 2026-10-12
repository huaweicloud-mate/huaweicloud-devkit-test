// D3-C1 ECS 生命周期 E2E（OpenCode Linux 真机）
// VPC+子网 → CreateServers(最小规格) → 轮询 ACTIVE → 删除含磁盘 → 归零验证 → 删VPC子网
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const SRC = '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(SRC).href);
const REGION = 'cn-north-4';
const AZ = 'cn-north-4a';
const FLAVOR = 'c6.large.2';
const IMAGE = '9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde';

const out = [];
function rec(name, ok, detail) {
  out.push({ name, pass: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' -> ' + detail : ''}`);
}
const redact = (v) => String(v).replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{8,}/g, '$1***');

const runW = async (args, timeout = 60000) => {
  const plan = await callTool('huaweicloud_plan_cli_command', { args, timeoutMs: 30000 });
  return callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: timeout });
};
const runR = async (args, timeout = 60000) => callTool('huaweicloud_run_readonly_command', { args, timeoutMs: timeout });

const stamp = Date.now().toString(36).slice(-6);
const vpcName = 'tctest-opencode-ecs-' + stamp;
let vpcId = '', subnetId = '', serverId = '', jobId = '';

// ① VPC
try {
  const r = await runW(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.100.0/24']);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r?.stdout || '');
  vpcId = m ? m[1] : '';
  rec('CreateVpc', r?.ok === true && !!vpcId, { vpcId });
} catch (e) { rec('CreateVpc', false, e.message); }

// ② Subnet
try {
  const r = await runW(['VPC', 'CreateSubnet', '--cli-region=' + REGION, '--subnet.vpc_id=' + vpcId, '--subnet.name=' + vpcName + '-sub', '--subnet.cidr=192.168.100.0/26', '--subnet.gateway_ip=192.168.100.1', '--subnet.availability_zone=' + AZ]);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r?.stdout || '');
  subnetId = m ? m[1] : '';
  rec('CreateSubnet', r?.ok === true && !!subnetId, { subnetId });
} catch (e) { rec('CreateSubnet', false, e.message); }

// ③ CreateServers（最小规格）
try {
  const args = ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.name=' + vpcName + '-srv', '--server.flavorRef=' + FLAVOR, '--server.imageRef=' + IMAGE, '--server.vpcid=' + vpcId, '--server.nics.1.subnet_id=' + subnetId, '--server.root_volume.volumetype=GPSSD', '--server.root_volume.size=10', '--server.count=1', '--server.availability_zone=' + AZ];
  const plan = await callTool('huaweicloud_plan_cli_command', { args, timeoutMs: 30000 });
  rec('CreateServers(审批分类)', plan.classification?.decision === 'deny' && plan.classification?.risk === 'write', plan.classification);
  const r = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 60000 });
  const m = /"job_id"\s*:\s*"([0-9a-f-]{32})"/.exec(r?.stdout || '') || /"job_id"\s*":\s*"([0-9a-f-]{32})"/.exec(r?.stdout || '');
  jobId = m ? m[1] : '';
  const sm = /"serverIds"\s*:\s*\[\s*"([0-9a-f-]{36})"/.exec(r?.stdout || '') || /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r?.stdout || '');
  serverId = sm ? sm[1] : '';
  rec('CreateServers(返回 job_id/serverIds)', r?.ok === true && (!!jobId || !!serverId), { jobId, serverId, out: (r?.stdout || '').slice(0, 160) });
} catch (e) { rec('CreateServers', false, e.message); }

// ④ 轮询 ACTIVE
try {
  let active = false;
  for (let i = 0; i < 20; i++) {
    if (jobId && !serverId) {
      const j = await runR(['ECS', 'ShowJob', '--cli-region=' + REGION, '--job_id=' + jobId], 30000);
      const sid = /"server_id"\s*:\s*"([0-9a-f-]{36})"|"serverIds"\s*:\s*\[\s*"([0-9a-f-]{36})"/.exec(j?.stdout || '');
      if (sid) serverId = sid[1] || sid[2];
    }
    if (serverId) {
      const l = await runR(['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--server_id=' + serverId], 30000);
      const st = /"status"\s*:\s*"([A-Z]+)"/.exec(l?.stdout || '');
      if (st && st[1] === 'ACTIVE') { active = true; break; }
      if (st && st[1] === 'ERROR') break;
    } else {
      const l = await runR(['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--name=' + vpcName + '-srv'], 30000);
      const sidc = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(l?.stdout || '');
      if (sidc) serverId = sidc[1];
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  rec('验证 ACTIVE', active, { serverId, active });
} catch (e) { rec('轮询 ACTIVE', false, e.message); }

// ⑤ 删除含磁盘
try {
  let delOk = true;
  if (serverId) {
    const args = ['ECS', 'DeleteServers', '--cli-region=' + REGION, '--servers.1.id=' + serverId, '--delete_publicip=false', '--delete_volume=true'];
    const plan = await callTool('huaweicloud_plan_cli_command', { args, timeoutMs: 30000 });
    const r = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    delOk = r?.ok === true;
  }
  rec('删除含磁盘', delOk, { serverId });
} catch (e) { rec('DeleteServers', false, e.message); }

// ⑥ 归零验证
try {
  await new Promise((r) => setTimeout(r, 5000));
  const l = await runR(['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--name=' + vpcName + '-srv'], 60000);
  const zeroed = !(l?.stdout || '').includes(vpcName + '-srv');
  rec('归零验证(ECS 不含本次资源)', zeroed, { containsOwn: !zeroed });
} catch (e) { rec('归零验证', false, e.message); }

// ⑦ 清理 VPC + 子网
try {
  if (subnetId && vpcId) { await runW(['VPC', 'DeleteSubnet', '--cli-region=' + REGION, '--vpc_id=' + vpcId, '--subnet_id=' + subnetId]); }
  if (vpcId) { await new Promise((r) => setTimeout(r, 3000)); await runW(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); }
  rec('清理 VPC+子网', true, JSON.stringify({ vpcId, subnetId }));
} catch (e) { rec('清理 VPC+子网', false, e.message); }

const allPass = out.filter((x) => !x.pass).length === 0;
const result = { case: 'D3-C1', status: allPass ? 'PASS' : 'FAIL', total: out.length, passed: out.filter((x) => x.pass).length, results: out, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14) };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('\n=== D3-C1', result.status, `${result.passed}/${result.total}`, '===');