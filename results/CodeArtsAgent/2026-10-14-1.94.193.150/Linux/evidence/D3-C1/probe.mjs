// D3-C1 ECS 生命周期 E2E（CodeArtsAgent Linux 每日回归，真机建删归零）
import { pathToFileURL } from 'node:url';
const CORE = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const REGION = 'cn-north-4';
const IMAGE = '74d6130f-ceb1-4a14-822e-d7b337efa713'; // Ubuntu 24.04 server 64bit
const FLAVOR = 'c6.large.2';
const TS = Date.now().toString(36).slice(-8);
let vpcId = '', subnetId = '', sgId = '', ecsId = '', jobId = '';
const log = [];
function rec(n, ok, detail) { log.push({ n, ok, detail: String(detail).slice(0, 300) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${n}`); }
async function run(args, timeoutMs = 60000) {
  const plan = await callTool('huaweicloud_plan_cli_command', { args });
  try {
    return await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs });
  } catch (e) { return { ok: false, __error: String(e).slice(0, 200), stdout: '' }; }
}
async function read(args, timeoutMs = 60000) {
  try { return await callTool('huaweicloud_run_readonly_command', { args, timeoutMs }); } catch (e) { return { ok: false, __error: String(e).slice(0, 200), stdout: '' }; }
}

// 1. 创建 VPC
try {
  const vpcName = 'tctest-c1-vpc-' + TS;
  const r = await run(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.200.0/24']);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r.stdout || '');
  vpcId = m ? m[1] : '';
  rec('创建 VPC ' + vpcName, r.ok === true && !!vpcId, { vpcId });
} catch (e) { rec('创建 VPC', false, e.message); }

// 2. 创建子网（v3 body 参数）
try {
  const subName = 'tctest-c1-subnet-' + TS;
  const r = await run(['VPC', 'CreateSubnet', '--cli-region=' + REGION, '--subnet.name=' + subName, '--subnet.cidr=192.168.200.0/24', '--subnet.vpc_id=' + vpcId, '--subnet.gateway_ip=192.168.200.1', '--subnet.availability_zone=cn-north-4a']);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r.stdout || '');
  subnetId = m ? m[1] : '';
  rec('创建子网 ' + subName, r.ok === true && !!subnetId, { subnetId, stdout: (r.stdout || '').slice(0, 120) });
} catch (e) { rec('创建子网', false, e.message); }

// 3. 创建安全组
try {
  const sgName = 'tctest-c1-sg-' + TS;
  const r = await run(['VPC', 'CreateSecurityGroup', '--cli-region=' + REGION, '--security_group.name=' + sgName]);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r.stdout || '');
  sgId = m ? m[1] : '';
  rec('创建安全组 ' + sgName, r.ok === true && !!sgId, { sgId });
} catch (e) { rec('创建安全组', false, e.message); }

// 4. 创建 ECS
try {
  const ecsName = 'tctest-c1-ecs-' + TS;
  const args = ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.count=1', '--server.name=' + ecsName, '--server.flavorRef=' + FLAVOR, '--server.imageRef=' + IMAGE, '--server.vpcid=' + vpcId, '--server.root_volume.volumetype=SSD', '--server.root_volume.size=40', '--server.nics.1.subnet_id=' + subnetId, '--server.nics.1.security_groups.1.id=' + sgId];
  const r = await run(args, 90000);
  const jm = /job_id"\s*:\s*"([0-9a-f]+)"/.exec(r.stdout || '');
  const sm = /serverIds"\s*:\s*\[\s*"([0-9a-f-]{36})"/.exec(r.stdout || '');
  jobId = jm ? jm[1] : '';
  ecsId = sm ? sm[1] : '';
  rec('创建 ECS ' + ecsName, r.ok === true && !!ecsId, { ecsId, jobId });
  if (!ecsId) console.log('  raw: ' + (r.stdout || r.__error || '').slice(0, 200));
} catch (e) { rec('创建 ECS', false, e.message); }

// 5. 轮询 ECS 状态（最多 ~90s）
if (ecsId) {
  let active = false;
  for (let i = 0; i < 12; i++) {
    const r = await read(['ECS', 'ListServers', '--cli-region=' + REGION, '--id=' + ecsId, '--cli-output=json'], 30000);
    const st = /"status"\s*:\s*"([A-Z]+)"/.exec(r.stdout || '');
    const s = st ? st[1] : '';
    if (s === 'ACTIVE') { active = true; break; }
    if (s === 'ERROR') break;
    await new Promise((x) => setTimeout(x, 8000));
  }
  rec('ECS 达成 ACTIVE', active, { ecsId, active });
}

// 6. 删除 ECS（含磁盘）
try {
  if (ecsId) {
    const r = await run(['ECS', 'DeleteServers', '--cli-region=' + REGION, '--servers.1.id=' + ecsId, '--servers.1.delete_volume=true'], 60000);
    rec('删除 ECS', r.ok === true, { ecsId });
  } else { rec('删除 ECS', true, '未创建无需删除'); }
} catch (e) { rec('删除 ECS', false, e.message); }

// 7. 删除安全组
try {
  if (sgId) { const r = await run(['VPC', 'DeleteSecurityGroup', '--cli-region=' + REGION, '--security_group_id=' + sgId], 30000); rec('删除安全组', r.ok === true, { sgId }); }
  else rec('删除安全组', true, '未创建');
} catch (e) { rec('删除安全组', false, e.message); }

// 8. 删除子网
try {
  if (subnetId) { const r = await run(['VPC', 'DeleteSubnet', '--cli-region=' + REGION, '--vpc_id=' + vpcId, '--subnet_id=' + subnetId], 30000); rec('删除子网', r.ok === true, { subnetId }); }
  else rec('删除子网', true, '未创建');
} catch (e) { rec('删除子网', false, e.message); }

// 9. 删除 VPC
try {
  if (vpcId) { const r = await run(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId], 30000); rec('删除 VPC', r.ok === true, { vpcId }); }
  else rec('删除 VPC', true, '未创建');
} catch (e) { rec('删除 VPC', false, e.message); }

// 10. 归零验证
const lv = await read(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], 60000);
const vpcZero = !(lv.stdout || '').includes(vpcId);
const le = await read(['ECS', 'ListServers', '--cli-region=' + REGION, '--cli-output=json'], 60000);
const ecsZero = !(le.stdout || '').includes(ecsId || 'tctest-c1-ecs');
rec('归零验证(VPC/ECS 均不含本次资源)', vpcZero && ecsZero, { vpcZero, ecsZero });

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D3-C1', total: log.length, passed: log.filter((l) => l.ok).length, results: log }, null, 2));
process.exit(0);
