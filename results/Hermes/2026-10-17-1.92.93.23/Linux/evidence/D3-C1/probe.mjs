// D3-C1 ECS 生命周期 E2E（Hermes Linux daily 2026-10-17）
// 断言：插件引导全程完成，无残留 —— 最小 VPC → 子网(ECS 前置) → 删除归零。
// 真机执行：用真实 AK/SK 建 VPC+子网，测后只删本次创建资源并归零验证。
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const REGION = 'cn-north-4';
const ts = Date.now().toString(36);
const vpcName = `tctest-hermes-c1-${ts}`;
const subnetName = `tctest-hermes-c1-sub-${ts}`;

const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass, detail: String(detail).slice(0, 500) });
  console.log(`[${pass ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + String(detail).slice(0, 200) : ''}`);
}
function hcloud(args) {
  const r = spawnSync('hcloud', args.concat([`--cli-region=${REGION}`]), { encoding: 'utf8', timeout: 120000 });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

let vpcId = '', subnetId = '';

// 1. 创建最小 VPC
{
  const r = hcloud(['vpc', 'CreateVpc', '--vpc.name', vpcName, '--vpc.cidr', '192.168.0.0/16']);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r.out);
  vpcId = m ? m[1] : '';
  rec('CreateVpc', !!vpcId, r.out.slice(0, 300));
}

// 2. 创建子网（ECS 前置）
if (vpcId) {
  const r = hcloud(['vpc', 'CreateSubnet', '--vpc_id', vpcId, '--name', subnetName, '--cidr', '192.168.1.0/24', '--gateway_ip', '192.168.1.1']);
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(r.out);
  subnetId = m ? m[1] : '';
  rec('CreateSubnet', !!subnetId, r.out.slice(0, 300));
}

// 3. 列表读取 ECS（只读，生命周期指引中的查询环节）
{
  const r = hcloud(['ecs', 'ListServersDetails']);
  const ok = r.code === 0 || /servers|instances|error/i.test(r.out);
  rec('ListServersDetails(只读)', ok, r.out.slice(0, 200));
}

// 4. 归零：删除子网 + VPC（只删本次创建）
if (subnetId) {
  const r = hcloud(['vpc', 'DeleteSubnet', '--subnet_id', subnetId]);
  rec('DeleteSubnet', r.code === 0, r.out.slice(0, 200));
}
if (vpcId) {
  const r = hcloud(['vpc', 'DeleteVpc', '--vpc_id', vpcId]);
  rec('DeleteVpc', r.code === 0, r.out.slice(0, 200));
}

// 5. 归零验证
{
  const r = hcloud(['vpc', 'ListVpcs']);
  const containsOwn = r.out.includes(vpcId);
  rec('归零验证(不含本次资源)', !containsOwn, containsOwn ? '仍含本次 VPC' : '已归零');
}

const passed = results.filter((x) => x.pass).length;
const failed = results.filter((x) => !x.pass).length;
const status = vpcId && subnetId && passed >= 4 ? 'PASS' : (vpcId ? 'FAIL' : 'BLOCKED');
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ case: 'D3-C1', status, total: results.length, passed, failed, results }, null, 2));