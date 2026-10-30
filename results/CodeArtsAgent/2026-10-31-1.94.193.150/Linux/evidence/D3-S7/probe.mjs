import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const CORE = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const REGION = 'cn-north-4';
const PROJECT_ID = '46c1fd48bd1248c7b75afc3780de7132';
const TS = Date.now().toString(36).slice(-8);
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 600) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
function redact(s) {
  return String(s).replace(/(password|secretKey|adminPass|securityToken)\s*[:=]\s*"?[^",\s}]+/gi, '$1=<redacted>');
}
function hc(args, timeout = 120000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0 && !/USE_ERROR|Invalid storage|Invalid parameter|\[ERROR\]|Confirm whether/.test(out);
  return { status: r.status, ok, out };
}
function grabUuid(json, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"([0-9a-fA-F-]{36})"');
  return (re.exec(json || '') || [])[1] || '';
}
function grabRdsId(json) {
  const re = /"id"\s*:\s*"([0-9a-fA-F]{32}in\d+)"|"instance_id"\s*:\s*"([0-9a-fA-F]{32}in\d+)"/;
  const m = re.exec(json || '');
  return (m && (m[1] || m[2])) || '';
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log('\n=====CASE D3-S7=====');
{
  let cat;
  try { cat = await callTool('huaweicloud_service_catalog', { intent: '部署一个带 MySQL 数据库的 Web 应用' }); } catch (e) { cat = { __error: String(e) }; }
  const svcStr = JSON.stringify(cat.recommendedServices || []).toLowerCase();
  const rdsHit = /rds|mysql|database/.test(svcStr);
  const deployHit = /sandbox|ecs|cce/.test(svcStr);
  console.log('serviceCatalog 复合意图路由 -> services=' + JSON.stringify(cat.recommendedServices) + ' RDS命中=' + rdsHit + ' 部署目标命中=' + deployHit);

  const vpcName = 'hdk-s7-vpc-' + TS, subnetName = 'hdk-s7-subnet-' + TS, sgName = 'hdk-s7-sg-' + TS;
  let vpcId = '', subnetId = '', sgId = '';
  {
    const r = hc(['VPC', 'CreateVpc', '--vpc.name=' + vpcName, '--vpc.cidr=192.168.66.0/24', '--cli-region=' + REGION, '--cli-output=json'], 120000);
    vpcId = grabUuid(r.out, 'id');
    console.log('CreateVpc -> ok=' + r.ok + ' id=' + vpcId.slice(0, 20));
  }
  if (vpcId) {
    const r = hc(['VPC', 'CreateSubnet', '--subnet.name=' + subnetName, '--subnet.cidr=192.168.66.0/26', '--subnet.gateway_ip=192.168.66.1', '--subnet.vpc_id=' + vpcId, '--subnet.dnsList.1=100.125.1.250', '--subnet.dnsList.2=100.125.21.250', '--cli-region=' + REGION, '--cli-output=json'], 120000);
    subnetId = grabUuid(r.out, 'id');
    console.log('CreateSubnet -> ok=' + r.ok + ' id=' + subnetId.slice(0, 20));
  }
  if (vpcId) {
    const r = hc(['VPC', 'CreateSecurityGroup', '--security_group.name=' + sgName, '--cli-region=' + REGION, '--cli-output=json'], 120000);
    sgId = grabUuid(r.out, 'id');
    console.log('CreateSecurityGroup -> ok=' + r.ok + ' id=' + sgId.slice(0, 20));
  }

  let createdOk = false, instanceId = '';
  if (vpcId && subnetId && sgId) {
    const instName = 'hdk-s7-' + TS;
    const jsonBody = {
      path: { project_id: PROJECT_ID },
      body: {
        name: instName, region: REGION,
        datastore: { type: 'MySQL', version: '8.0' },
        ha: { mode: 'single', replication_mode: 'semisync' },
        flavor_ref: 'rds.mysql.large.arm2.single',
        volume: { type: 'CLOUDSSD', size: 40 },
        vpc_id: vpcId, subnet_id: subnetId, security_group_id: sgId,
        availability_zone: 'cn-north-4a',
        password: 'HdkS7@Test12345',
        charge_info: { charge_mode: 'postPaid' },
      },
    };
    const jsonFile = '/tmp/hdk-rds-body-' + TS + '.json';
    writeFileSync(jsonFile, JSON.stringify(jsonBody));
    const r = hc(['RDS', 'CreateInstance', '--cli-jsonInput=' + jsonFile, '--cli-region=' + REGION, '--cli-output=json'], 300000);
    instanceId = grabRdsId(r.out);
    console.log('RDS CreateInstance -> ok=' + r.ok + ' instanceId=' + instanceId.slice(0, 24) + (r.ok && instanceId ? '' : ' err=' + redact(r.out).slice(0, 260)));
    createdOk = r.ok && !!instanceId;
  }

  let rdsCleanup = true, sgCleanup = true, subnetCleanup = true, vpcCleanup = true;
  if (instanceId) {
    // 等待实例 ACTIVE 后删除
    for (let i = 0; i < 40; i++) {
      const lr = hc(['RDS', 'ListInstances', '--cli-region=' + REGION, '--cli-output=json'], 60000);
      const statusM = new RegExp('"id"\\s*:\\s*"' + instanceId + '"[^}]*"status"\\s*:\\s*"([^"]+)"').exec(lr.out);
      const st = statusM ? statusM[1] : '';
      if (i % 4 === 0) console.log('  RDS 状态轮询 ' + (i + 1) + ' 次, status=' + (st || '(未就绪)'));
      if (st === 'ACTIVE' || st === 'FAILED') break;
      await sleep(30000);
    }
    const del = hc(['RDS', 'DeleteInstance', '--instance_id=' + instanceId, '--cli-region=' + REGION, '--cli-output=json'], 600000);
    rdsCleanup = del.ok || /job_id/.test(del.out);
    console.log('RDS DeleteInstance -> ok=' + rdsCleanup);
    // 等待删除完成
    let gone = false;
    for (let i = 0; i < 20 && !gone; i++) {
      await sleep(30000);
      const lr = hc(['RDS', 'ListInstances', '--cli-region=' + REGION, '--cli-output=json'], 60000);
      gone = !(lr.out || '').includes(instanceId);
    }
    console.log('RDS 删除归零 = ' + gone);
    rdsCleanup = rdsCleanup && gone;
  }
  if (sgId) { const d = hc(['VPC', 'DeleteSecurityGroup', '--security_group_id=' + sgId, '--cli-region=' + REGION, '--cli-output=json'], 60000); sgCleanup = !/USE_ERROR/.test(d.out); console.log('DeleteSecurityGroup -> ok=' + sgCleanup); }
  if (subnetId && vpcId) {
    let subnetGone = false;
    for (let i = 0; i < 20 && !subnetGone; i++) {
      const d = hc(['VPC', 'DeleteSubnet', '--vpc_id=' + vpcId, '--subnet_id=' + subnetId, '--cli-region=' + REGION, '--cli-output=json'], 60000);
      if (!/still used|VPC.0213/.test(d.out)) { subnetGone = true; break; }
      await sleep(30000);
    }
    subnetCleanup = subnetGone;
    console.log('DeleteSubnet -> ok=' + subnetGone);
  }
  await sleep(3000);
  if (vpcId) { const d = hc(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId, '--cli-region=' + REGION, '--cli-output=json'], 60000); vpcCleanup = !/USE_ERROR|RouterInUse/.test(d.out); console.log('DeleteVpc -> ok=' + vpcCleanup); }
  const listVpc = hc(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], 60000);
  const zeroed = !(listVpc.out || '').includes(vpcName);
  console.log('归零验证 = ' + zeroed);

  check('serviceCatalog 复合意图命中 RDS', rdsHit, JSON.stringify(cat.recommendedServices));
  check('VPC/子网/安全组前置编排完成', !!(vpcId && subnetId && sgId), 'vpc=' + vpcId.slice(0, 8) + ' subnet=' + subnetId.slice(0, 8) + ' sg=' + sgId.slice(0, 8));
  check('最小 RDS 实例创建成功(CLOUDSSD+jsonInput)', createdOk, 'instanceId=' + instanceId.slice(0, 20));
  check('测后删除归零(RDS+SG+子网+VPC)', rdsCleanup && sgCleanup && subnetCleanup && vpcCleanup && zeroed, JSON.stringify({ rdsCleanup, sgCleanup, subnetCleanup, vpcCleanup, zeroed }));
}
console.log('=====END D3-S7=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
