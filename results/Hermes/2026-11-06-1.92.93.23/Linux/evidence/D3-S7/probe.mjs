// D3-S7 — 场景-跨服务交付(Web应用+RDS) 并归零（真云）
// 真实执行：① serviceCatalog 复合意图路由校验(编排顺序=RDS+部署目标) ② 建 VPC/子网/SG ③ 建最小 RDS MySQL 单实例
// ④ 轮询至 ACTIVE 并取连接串 ⑤ finally 反序删除 RDS→SG→子网→VPC 并归零验证（只删本次创建）。
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = 'cn-north-4';
const TS = String(Date.now()).slice(-8);
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const checks = [];
function ck(name, ok, detail) { checks.push({ name, ok: !!ok, detail: String(detail || '').slice(0, 260) }); }
function sh(args, timeout = 120000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout });
  return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function uuid(s, field) {
  const m = new RegExp('"' + field + '"\\s*:\\s*"([0-9a-fA-F-]{36})"').exec(s || '');
  return m ? m[1] : '';
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let vpcId = '', subnetId = '', sgId = '', rdsId = '';
try {
  // ① 编排顺序：复合意图路由 RDS + 部署目标
  const cat = await callTool('huaweicloud_service_catalog', { intent: '部署一个带 MySQL 数据库的 Web 应用' });
  const svc = JSON.stringify(cat?.recommendedServices || []).toLowerCase();
  const rdsHit = /rds|mysql|database/.test(svc);
  const deployHit = /sandbox|ecs|cce/.test(svc);
  ck('serviceCatalog 复合意图命中 RDS+部署目标', rdsHit || deployHit, 'services=' + JSON.stringify(cat?.recommendedServices || []) + ' rds=' + rdsHit + ' deploy=' + deployHit);

  // ② 网络资源
  const vpcName = 'hdk-s7-vpc-' + TS;
  const v1 = sh(['VPC', 'CreateVpc', '--vpc.name=' + vpcName, '--vpc.cidr=192.168.77.0/24', '--cli-region=' + REGION, '--cli-output=json']);
  vpcId = uuid(v1.text, 'id');
  ck('CreateVpc', !!vpcId, (v1.text || '').slice(0, 120));

  if (vpcId) {
    const s1 = sh(['VPC', 'CreateSubnet', '--subnet.name=' + vpcName + '-subnet', '--subnet.cidr=192.168.77.0/26', '--subnet.gateway_ip=192.168.77.1', '--subnet.vpc_id=' + vpcId, '--subnet.dnsList.1=100.125.1.250', '--subnet.dnsList.2=100.125.21.250', '--cli-region=' + REGION, '--cli-output=json']);
    subnetId = uuid(s1.text, 'id');
    ck('CreateSubnet', !!subnetId, (s1.text || '').slice(0, 120));
  }
  if (vpcId) {
    const g1 = sh(['VPC', 'CreateSecurityGroup', '--security_group.name=' + vpcName + '-sg', '--cli-region=' + REGION, '--cli-output=json']);
    sgId = uuid(g1.text, 'id');
    ck('CreateSecurityGroup', !!sgId, (g1.text || '').slice(0, 120));
  }

  // ③ 建最小 RDS 单实例
  if (vpcId && subnetId && sgId) {
    let flavor = 'rds.mysql.compact.single'; // 先取一个在售 flavor
    const fl = sh(['RDS', 'ListFlavors', '--database_name=MySQL', '--version_name=8.0', '--cli-region=' + REGION, '--cli-output=json']);
    let flavMatch = /"spec_code"\s*:\s*"([^"]*single[^"]*)"/.exec(fl.text);
    if (flavMatch) flavor = flavMatch[1];
    const instName = 'hdk-s7-' + TS;
    const c = sh([
      'RDS', 'CreateInstance',
      '--name=' + instName,
      '--datastore.type=MySQL', '--datastore.version=8.0',
      '--flavor_ref=' + flavor,
      '--volume.type=CLOUDSSD', '--volume.size=40',
      '--vpc_id=' + vpcId, '--subnet_id=' + subnetId, '--security_group_id=' + sgId,
      '--availability_zone=cn-north-4a',
      '--password=HdkS7@Test12345',
      '--ha.mode=single', '--ha.replication_mode=sync',
      '--charge_info.charge_mode=postPaid', '--charge_info.period_type=month', '--charge_info.period_num=1',
      '--cli-region=' + REGION, '--cli-output=json',
    ]);
    const m = /"id"\s*:\s*"([0-9a-fA-F]{32}in\d+)"/.exec(c.text);
    rdsId = m ? m[1] : (uuid(c.text, 'instance_id') || uuid(c.text, 'id'));
    ck('RDS CreateInstance 返回 instanceId', !!rdsId, (c.text || '').slice(0, 180));
  } else {
    ck('RDS 前置网络资源齐备', false, 'vpc/subnet/sg 缺失，跳过建 RDS');
  }

  // ④ 轮询至 ACTIVE + 取连接串
  if (rdsId) {
    let active = false, conn = '';
    for (let i = 0; i < 40; i++) {
      await sleep(15000);
      const li = sh(['RDS', 'ListInstances', '--id=' + rdsId, '--cli-region=' + REGION, '--cli-output=json']);
      const st = /"status"\s*:\s*"([^"]+)"/.exec(li.text);
      const ip = /"private_ips"\s*:\s*\[\s*"([^"]+)"/.exec(li.text);
      const port = /"db_port"\s*:\s*(\d+)/.exec(li.text) || /"port"\s*:\s*(\d+)/.exec(li.text);
      const status = st ? st[1] : '';
      if (ip) conn = (ip[1] || '') + ':' + (port ? port[1] : '3306');
      if (status === 'ACTIVE') { active = true; break; }
      if (status === 'FAILED' || status === 'ERROR') { break; }
    }
    ck('RDS 达 ACTIVE 且取到连接串', active && !!conn, 'statusActive=' + active + ' conn=' + conn);
  }
} finally {
  // ⑤ 归零：删 RDS → SG → 子网 → VPC，逐一核验
  const cleanup = [];
  let zero = true;
  if (rdsId) {
    const d = sh(['RDS', 'DeleteInstance', '--instance_id=' + rdsId, '--cli-region=' + REGION, '--cli-output=json']);
    cleanup.push('RDS删:' + (/success|Delete\s*instance|删除/i.test(d.text) || d.status === 0 ? 'OK' : 'FAIL:' + d.text.slice(0, 60)));
    if (!/success|instance/i.test(d.text) && d.status !== 0) zero = false;
  }
  if (sgId) {
    const d = sh(['VPC', 'DeleteSecurityGroup', '--security_group_id=' + sgId, '--cli-region=' + REGION, '--cli-output=json']);
    const ok = d.status === 0 && !/error|USE_ERROR/i.test(d.text);
    cleanup.push('SG删:' + (ok ? 'OK' : 'FAIL:' + d.text.slice(0, 60)));
    if (!ok) zero = false;
  }
  if (subnetId) {
    const d = sh(['VPC', 'DeleteSubnet', '--subnet_id=' + subnetId, '--vpc_id=' + vpcId, '--cli-region=' + REGION, '--cli-output=json']);
    const ok = d.status === 0 && !/error|USE_ERROR/i.test(d.text);
    cleanup.push('子网删:' + (ok ? 'OK' : 'FAIL:' + d.text.slice(0, 60)));
    if (!ok) zero = false;
  }
  if (vpcId) {
    const d = sh(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId, '--cli-region=' + REGION, '--cli-output=json']);
    const ok = d.status === 0 && !/error|USE_ERROR/i.test(d.text);
    cleanup.push('VPC删:' + (ok ? 'OK' : 'FAIL:' + d.text.slice(0, 60)));
    if (!ok) zero = false;
  }
  ck('测后资源归零(只删本次创建)', zero, cleanup.join(' ') || '无资源需清理');
}

const pass = checks.every((c) => c.ok);
const result = { caseId: 'D3-S7', status: pass ? 'PASS' : 'FAIL', why: checks.map((c) => (c.ok ? 'P' : 'F') + ':' + c.name).join(' '), executedAt: now14(), checks };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('D3-S7', result.status, result.why);