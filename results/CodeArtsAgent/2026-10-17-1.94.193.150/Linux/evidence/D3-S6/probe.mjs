import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

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
  return { status: r.status, ok: r.status === 0, out };
}
function grab(json, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"([^"]+)"');
  return (re.exec(json || '') || [])[1] || '';
}
function grabUuid(json, field) {
  const re = new RegExp('"' + field + '"\\s*:\\s*"([0-9a-fA-F-]{36})"');
  return (re.exec(json || '') || [])[1] || '';
}

console.log('\n=====CASE D3-S6=====');
{
  let cat;
  try { cat = await callTool('huaweicloud_service_catalog', { intent: '部署 Python 函数，每天定时执行' }); } catch (e) { cat = { __error: String(e) }; }
  const svcStr = JSON.stringify(cat.recommendedServices || []).toLowerCase();
  const fgHit = /functiongraph|serverless/.test(svcStr);
  console.log('serviceCatalog 路由 -> services=' + JSON.stringify(cat.recommendedServices));
  const fnName = 'hdk-s6-' + TS;
  const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');
  const createArgs = ['FunctionGraph', 'CreateFunction', '--func_name=' + fnName, '--package=default', '--runtime=Python3.10', '--handler=index.handler', '--code_type=inline', '--func_code.file=' + code, '--timeout=3', '--memory_size=128', '--cli-region=' + REGION, '--cli-output=json'];
  const cr = hc(createArgs, 120000);
  const urn = grab(cr.out, 'func_urn');
  console.log('CreateFunction -> status=' + cr.status + ' urn=' + urn.slice(0, 60));
  let triggerOk = false, triggerId = '';
  if (cr.ok && urn) {
    const trg = ['FunctionGraph', 'CreateFunctionTrigger', '--function_urn=' + urn, '--trigger_type_code=TIMER', '--event_data.name=' + fnName + '-t', '--event_data.schedule=0 0 2 * * ?', '--event_data.schedule_type=Cron', '--cli-region=' + REGION, '--cli-output=json'];
    const tr = hc(trg, 120000);
    triggerId = grab(tr.out, 'trigger_id');
    triggerOk = tr.ok && !!triggerId;
    console.log('CreateFunctionTrigger -> status=' + tr.status + ' trigger_id=' + triggerId.slice(0, 20));
  }
  let cleanup = false;
  if (urn) {
    const delArgs = ['FunctionGraph', 'DeleteFunction', '--function_urn=' + urn.replace(/:latest$/, ''), '--cli-region=' + REGION, '--cli-output=json'];
    const dr = hc(delArgs, 120000);
    cleanup = dr.status === 0;
    console.log('DeleteFunction -> status=' + dr.status);
  }
  const listAfter = hc(['FunctionGraph', 'ListFunctions', '--cli-region=' + REGION, '--cli-output=json'], 120000);
  const zeroed = !(listAfter.out || '').includes(fnName);
  console.log('归零验证 = ' + zeroed);
  check('serviceCatalog 路由 FunctionGraph', fgHit, JSON.stringify(cat.recommendedServices));
  check('创建 Python 函数返回 URN', cr.ok && !!urn, 'urn=' + urn.slice(0, 40));
  check('定时触发器绑定成功', triggerOk, 'trigger_id=' + triggerId);
  check('测后删除函数归零', cleanup && zeroed, 'cleanup=' + cleanup + ' zeroed=' + zeroed);
}
console.log('=====END D3-S6=====');

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
    console.log('CreateVpc -> status=' + r.status + ' id=' + vpcId.slice(0, 14) + (r.ok ? '' : ' err=' + redact(r.out).slice(0, 160)));
  }
  if (vpcId) {
    const r = hc(['VPC', 'CreateSubnet', '--subnet.name=' + subnetName, '--subnet.cidr=192.168.66.0/26', '--subnet.gateway_ip=192.168.66.1', '--subnet.vpc_id=' + vpcId, '--subnet.dnsList.1=100.125.1.250', '--subnet.dnsList.2=100.125.21.250', '--cli-region=' + REGION, '--cli-output=json'], 120000);
    subnetId = grabUuid(r.out, 'id');
    console.log('CreateSubnet -> status=' + r.status + ' id=' + subnetId.slice(0, 14) + (r.ok ? '' : ' err=' + redact(r.out).slice(0, 160)));
  }
  if (vpcId) {
    const r = hc(['VPC', 'CreateSecurityGroup', '--security_group.name=' + sgName, '--security_group.vpc_id=' + vpcId, '--cli-region=' + REGION, '--cli-output=json'], 120000);
    sgId = grabUuid(r.out, 'id');
    console.log('CreateSecurityGroup -> status=' + r.status + ' id=' + sgId.slice(0, 14) + (r.ok ? '' : ' err=' + redact(r.out).slice(0, 160)));
  }
  let createdOk = false, instanceId = '';
  if (vpcId && subnetId && sgId) {
    const instName = 'hdk-s7-' + TS;
    const createArgs = ['RDS', 'CreateInstance', '--name=' + instName, '--datastore.type=MySQL', '--datastore.version=8.0', '--flavor_ref=rds.mysql.large.arm2.single', '--volume.type=ULTRAHIGH', '--volume.size=40', '--availability_zone=cn-north-4a', '--vpc_id=' + vpcId, '--subnet_id=' + subnetId, '--security_group_id=' + sgId, '--password=HdkS7@Test12345', '--cli-region=' + REGION, '--cli-output=json'];
    const r = hc(createArgs, 300000);
    instanceId = grab(r.out, 'job_id') || grabUuid(r.out, 'instance') || grab(r.out, 'id');
    console.log('RDS CreateInstance -> status=' + r.status + ' job_id=' + instanceId.slice(0, 20) + (r.ok ? '' : ' stdout=' + redact(r.out).slice(0, 220)));
    createdOk = r.ok && !!instanceId;
  }
  let rdsCleanup = true, sgCleanup = true, subnetCleanup = true, vpcCleanup = true;
  if (instanceId) {
    const del = hc(['RDS', 'DeleteInstance', '--instance_id=' + instanceId, '--cli-region=' + REGION, '--cli-output=json'], 600000);
    rdsCleanup = del.status === 0;
    console.log('RDS DeleteInstance -> status=' + del.status);
  }
  if (sgId) { const d = hc(['VPC', 'DeleteSecurityGroup', '--security_group_id=' + sgId, '--cli-region=' + REGION, '--cli-output=json'], 60000); sgCleanup = d.status === 0; console.log('DeleteSecurityGroup -> status=' + d.status); }
  if (subnetId) { const d = hc(['VPC', 'DeleteSubnet', '--subnet_id=' + subnetId, '--cli-region=' + REGION, '--cli-output=json'], 60000); subnetCleanup = d.status === 0; console.log('DeleteSubnet -> status=' + d.status); }
  if (vpcId) { const d = hc(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId, '--cli-region=' + REGION, '--cli-output=json'], 60000); vpcCleanup = d.status === 0; console.log('DeleteVpc -> status=' + d.status); }
  const listVpc = hc(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], 60000);
  const zeroed = !(listVpc.out || '').includes(vpcName);
  console.log('归零验证 = ' + zeroed);
  check('serviceCatalog 复合意图命中 RDS', rdsHit, JSON.stringify(cat.recommendedServices));
  check('VPC/子网/安全组前置编排完成', !!(vpcId && subnetId && sgId), 'vpc=' + vpcId.slice(0, 8) + ' subnet=' + subnetId.slice(0, 8) + ' sg=' + sgId.slice(0, 8));
  check('最小 RDS 实例创建成功(返回 job_id)', createdOk, 'job_id=' + instanceId.slice(0, 12));
  check('测后删除归零(RDS+SG+子网+VPC)', rdsCleanup && sgCleanup && subnetCleanup && vpcCleanup && zeroed, JSON.stringify({ rdsCleanup, sgCleanup, subnetCleanup, vpcCleanup, zeroed }));
}
console.log('=====END D3-S7=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
