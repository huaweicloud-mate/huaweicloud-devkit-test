import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const CORE = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const REGION = 'cn-north-4';
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
  const ok = r.status === 0 && !/USE_ERROR|Invalid parameter|\[ERROR\]|Confirm whether/.test(out);
  return { status: r.status, ok, out };
}
function grab(json, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"([^"]+)"');
  return (re.exec(json || '') || [])[1] || '';
}
function grabUuid(json, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"([0-9a-fA-F-]{36})"');
  return (re.exec(json || '') || [])[1] || '';
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
    const body = {
      name: instName,
      datastore: { type: 'MySQL', version: '8.0' },
      flavor_ref: 'rds.mysql.large.arm2.single',
      volume: { type: 'ULTRAHIGH', size: 40 },
      availability_zone: 'cn-north-4a',
      vpc_id: vpcId,
      subnet_id: subnetId,
      security_group_id: sgId,
      password: 'HdkS7@Test12345',
    };
    const jsonFile = '/tmp/hdk-rds-body-' + TS + '.json';
    writeFileSync(jsonFile, JSON.stringify(body));
    const r = hc(['RDS', 'CreateInstance', '--cli-jsonInput=' + jsonFile, '--cli-region=' + REGION, '--cli-output=json'], 300000);
    const jobId = grab(r.out, 'job_id');
    console.log('RDS CreateInstance(jsonInput) -> ok=' + r.ok + ' job_id=' + jobId.slice(0, 20) + (r.ok ? '' : ' err=' + redact(r.out).slice(0, 260)));
    if (r.ok && jobId) {
      for (let i = 0; i < 20 && !instanceId; i++) {
        await sleep(30000);
        const lr = hc(['RDS', 'ListInstances', '--cli-region=' + REGION, '--cli-output=json'], 60000);
        const m = new RegExp('"id"\\s*:\\s*"([^"]+)"[^}]*"name"\\s*:\\s*"' + instName + '"').exec(lr.out) || new RegExp('"name"\\s*:\\s*"' + instName + '"[^}]*"id"\\s*:\\s*"([^"]+)"').exec(lr.out);
        if (m) instanceId = m[1];
        if (i % 3 === 0) console.log('  轮询 ' + (i + 1) + ' 次, instanceId=' + (instanceId || '(未就绪)').slice(0, 20));
      }
    }
    createdOk = r.ok && !!instanceId;
    console.log('RDS 实例定位 -> instanceId=' + instanceId.slice(0, 20));
  }

  let rdsCleanup = true, sgCleanup = true, subnetCleanup = true, vpcCleanup = true;
  if (instanceId) {
    const del = hc(['RDS', 'DeleteInstance', '--instance_id=' + instanceId, '--cli-region=' + REGION, '--cli-output=json'], 600000);
    rdsCleanup = del.ok;
    console.log('RDS DeleteInstance -> ok=' + del.ok + (del.ok ? '' : ' err=' + redact(del.out).slice(0, 160)));
  }
  if (sgId) { const d = hc(['VPC', 'DeleteSecurityGroup', '--security_group_id=' + sgId, '--cli-region=' + REGION, '--cli-output=json'], 60000); sgCleanup = d.ok; console.log('DeleteSecurityGroup -> ok=' + d.ok); }
  if (subnetId && vpcId) { const d = hc(['VPC', 'DeleteSubnet', '--vpc_id=' + vpcId, '--subnet_id=' + subnetId, '--cli-region=' + REGION, '--cli-output=json'], 60000); subnetCleanup = d.ok; console.log('DeleteSubnet -> ok=' + d.ok); }
  await sleep(3000);
  if (vpcId) { const d = hc(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId, '--cli-region=' + REGION, '--cli-output=json'], 60000); vpcCleanup = d.ok; console.log('DeleteVpc -> ok=' + d.ok); }
  const listVpc = hc(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], 60000);
  const zeroed = !(listVpc.out || '').includes(vpcName);
  console.log('归零验证 = ' + zeroed);

  check('serviceCatalog 复合意图命中 RDS', rdsHit, JSON.stringify(cat.recommendedServices));
  check('VPC/子网/安全组前置编排完成', !!(vpcId && subnetId && sgId), 'vpc=' + vpcId.slice(0, 8) + ' subnet=' + subnetId.slice(0, 8) + ' sg=' + sgId.slice(0, 8));
  check('最小 RDS 实例创建成功并定位 instance', createdOk, 'instanceId=' + instanceId.slice(0, 16));
  check('测后删除归零(RDS+SG+子网+VPC)', rdsCleanup && sgCleanup && subnetCleanup && vpcCleanup && zeroed, JSON.stringify({ rdsCleanup, sgCleanup, subnetCleanup, vpcCleanup, zeroed }));
}
console.log('=====END D3-S7=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
