// 2026-11-07 OpenClaw Linux — D3-S7 跨服务交付(Web+RDS)并归零 真机 E2E 探针
// ①serviceCatalog 复合意图→RDS ②建 VPC→subnet→sg→RDS(MySQL postPaid) ③轮询 ACTIVE ④连接串字段 ⑤测后 RDS→subnet→VPC 归零
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REGION = 'cn-north-4';
const cred = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const ak = cred.ak, sk = cred.sk;
const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');

let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }
function hcloud(args) {
  return spawnSync('hcloud', [...args, `--cli-region=${REGION}`, `--cli-access-key=${ak}`, `--cli-secret-key=${sk}`, '--cli-output=json'], { encoding: 'utf8', timeout: 180000 });
}
function parse(r) { const i = (r.stdout || '').indexOf('{'); if (i < 0) return null; try { return JSON.parse(r.stdout.slice(i)); } catch { return null; } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ① 复合意图路由
{
  const r = await callTool('huaweicloud_service_catalog', { intent: '部署一个网站, 数据库用 MySQL', vendorConfirmed: '华为云' });
  const svcs = r?.recommendedServices || [];
  note(`D3-S7 复合意图 => ${JSON.stringify(svcs)}`);
  check('D3-S7', '复合意图命中 RDS', svcs.includes('RDS'), true);
  const deploy = svcs.some((s) => /sandbox|ecs|cce|devstation/i.test(s));
  check('D3-S7', '复合意图命中部署目标', deploy, true);
}

const vpcName = `tctest-s7-${Date.now() % 1000000000}`;
let vpcId = null, subnetId = null, rdsId = null, rdsEndpoint = null, rdsPort = null;
try {
  const vpc = parse(hcloud(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.211.0.0/16']));
  vpcId = vpc?.vpc?.id || null;
  check('D3-S7', '创建 VPC', !!vpcId, true);
  await sleep(2000);

  const sub = parse(hcloud(['VPC', 'CreateSubnet', `--subnet.name=${vpcName}-sub`, `--subnet.vpc_id=${vpcId}`, '--subnet.cidr=10.211.1.0/24', '--subnet.gateway_ip=10.211.1.1', '--subnet.availability_zone=cn-north-4a']));
  subnetId = sub?.subnet?.id || null;
  check('D3-S7', '创建 Subnet', !!subnetId, true);

  const sgRaw = parse(hcloud(['VPC', 'ListSecurityGroups/v3']));
  const sgId = (sgRaw?.security_groups || []).find((s) => (s.name || '').toLowerCase() === 'default')?.id;
  note(`D3-S7 default SG id=${sgId}`);

  if (vpcId && subnetId && sgId) {
    const projRaw = parse(hcloud(['IAM', 'KeystoneListProjects']));
    const pid = (projRaw?.projects || []).find((p) => p.name === REGION)?.id;
    const bodyJson = JSON.stringify({
      header: {}, path: { project_id: pid },
      body: {
        name: `tctests7db${Date.now() % 1000000}`,
        datastore: { type: 'MySQL', version: '8.0' },
        flavor_ref: 'rds.mysql.x1.large.2',
        volume: { type: 'CLOUDSSD', size: 40 },
        password: 'Tctest12345_',
        region: REGION, availability_zone: 'cn-north-4a',
        charge_info: { charge_mode: 'postPaid' }, port: '3306',
        vpc_id: vpcId, subnet_id: subnetId, security_group_id: sgId,
      },
    });
    const tmpf = join(tmpdir(), `rds-create-${Date.now()}.json`);
    writeFileSync(tmpf, bodyJson);
    const create = hcloud(['RDS', 'CreateInstance', `--cli-jsonInput=${tmpf}`]);
    const cj = parse(create);
    rdsId = cj?.instance?.id || null;
    note(`D3-S7 RDS create rc=${create.returncode} id=${rdsId} stderr=${(create.stderr||'').slice(0,120)}`);
    check('D3-S7', 'postPaid RDS 创建受理(id 非空)', !!rdsId, true);
  }
} catch (e) {
  note(`D3-S7 建栈异常: ${String(e?.message || e).slice(0, 160)}`);
}

// ③ 轮询 ACTIVE（有界 ~300s）
let active = false;
if (rdsId) {
  for (let i = 0; i < 30; i++) {
    await sleep(10000);
    const ls = parse(hcloud(['RDS', 'ListInstances']));
    const inst = (ls?.instances || []).find((x) => x.id === rdsId);
    if (inst) {
      note(`D3-S7 RDS status=${inst.status} (${i + 1}/30)`);
      if (inst.status === 'ACTIVE') {
        active = true;
        rdsEndpoint = inst.private_ips?.[0] || inst.ip || null;
        rdsPort = inst.port || 3306;
        check('D3-S7', 'RDS 实例到达 ACTIVE', true, true);
        check('D3-S7', '连接串字段(ip/port)存在', !!(rdsEndpoint && rdsPort), true);
        note(`D3-S7 连接串注入: mysql://${rdsEndpoint}:${rdsPort}`);
        break;
      }
    }
  }
  if (!active) {
    note('D3-S7 RDS 未在 300s 内 ACTIVE');
    check('D3-S7', 'RDS 实例到达 ACTIVE', false, true);
  }
}

// ⑤ 归零：删 RDS → subnet → VPC
try {
  if (rdsId) {
    const del = hcloud(['RDS', 'DeleteInstance', `--instance_id=${rdsId}`]);
    note(`D3-S7 DeleteInstance rc=${del.returncode}`);
    check('D3-S7', '删除本次 RDS 受理', del.returncode === 0, true);
  }
  let rdsGone = false;
  if (rdsId) {
    for (let i = 0; i < 30; i++) {
      await sleep(10000);
      const ls = parse(hcloud(['RDS', 'ListInstances']));
      if (!(ls?.instances || []).some((x) => x.id === rdsId)) { rdsGone = true; break; }
    }
    note(`D3-S7 RDS 删除完成=${rdsGone}`);
  }
  if (subnetId && vpcId) {
    for (let i = 0; i < 12; i++) {
      const d = hcloud(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`]);
      if (d.returncode === 0) break;
      await sleep(10000);
    }
    await sleep(2000);
    for (let i = 0; i < 6; i++) {
      const dv = hcloud(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`]);
      if (dv.returncode === 0) break;
      await sleep(5000);
    }
  }
  const vpcs = parse(hcloud(['VPC', 'ListVpcs/v3']));
  const remain = (vpcs?.vpcs || []).filter((v) => (v.name || '').startsWith('tctest-s7-')).length;
  check('D3-S7', '测后 tctest-s7- 资源归零', remain, 0);
} catch (e) {
  note(`D3-S7 归零异常: ${String(e?.message || e).slice(0, 160)}`);
}

console.log('\n=== OpenClaw Linux D3-S7 跨服务交付 探针结果 (2026-11-07) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);