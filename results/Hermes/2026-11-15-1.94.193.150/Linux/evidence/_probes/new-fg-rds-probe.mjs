import { pathToFileURL } from 'node:url';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const { execFileSync } = await import('node:child_process');

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 600) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
function redact(s) {
  return String(s).replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***').replace(/("?(?:password|adminPass)"?\s*[:=]\s*")[^"]+(")/gi, '$1<redacted>$2');
}
async function call(name, args) {
  try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 300) }; }
}
function idOf(json, field) {
  const re = new RegExp('"' + (field || 'id') + '"\\s*:\\s*"([0-9a-zA-Z-]{10,})"');
  return (re.exec(json || '') || [])[1] || '';
}
const REGION = 'cn-north-4';
const TS = Date.now().toString(36).slice(-8);

// ============ D3-S6 场景-FunctionGraph 定时任务 ============
console.log('\n=====CASE D3-S6=====');
{
  const cat = await call('huaweicloud_service_catalog', { intent: '部署 Python 函数，每天定时执行' });
  const svcStr = JSON.stringify(cat.recommendedServices || []).toLowerCase();
  console.log('路由 -> ' + JSON.stringify({ skills: cat.recommendedSkills, services: cat.recommendedServices }));
  const fgHit = /functiongraph|serverless/.test(svcStr) || /functiongraph/.test(JSON.stringify(cat.recommendedSkills || []).toLowerCase());
  const fnName = 'hdk-s6-' + TS;
  const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');
  const createArgs = ['FunctionGraph', 'CreateFunction', '--cli-region=' + REGION, '--function_name=' + fnName, '--package=default', '--runtime=Python3.10', '--handler=index.handler', '--code.filename=index.py', '--code.zip_file=' + code, '--timeout=3', '--memory_size=128'];
  let urn = '';
  let created = false;
  try {
    const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
    console.log('plan CreateFunction -> decision=' + (cp.classification && cp.classification.decision) + ' safeToRun=' + cp.safeToRun);
    const cr = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    console.log('run CreateFunction -> ok=' + cr.ok + ' stdout=' + redact(cr.stdout || '').slice(0, 200));
    urn = idOf(cr.stdout || '', 'func_urn');
    created = cr.ok === true && !!urn;
  } catch (e) { console.log('FG create 异常: ' + String(e).slice(0, 200)); }
  // 定时触发器
  let triggerOk = false;
  if (created) {
    const trg = ['FunctionGraph', 'CreateFunctionTrigger', '--cli-region=' + REGION, '--function_urn=' + urn, '--trigger_type_code=TIMER', '--event_type_code=MessageCreated', '--trigger_status=ACTIVE', '--event_data={"schedule":"0 0 2 * * ?"}'];
    const tp = await call('huaweicloud_plan_cli_command', { args: trg, allowWrites: true });
    const tr = await call('huaweicloud_run_approved_command', { args: trg, approvalToken: tp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    console.log('CreateFunctionTrigger -> ok=' + tr.ok + ' stdout=' + redact(tr.stdout || '').slice(0, 160));
    triggerOk = tr.ok === true;
  }
  // 清理：删除函数
  let cleanup = false;
  if (urn) {
    const del = ['FunctionGraph', 'DeleteFunction', '--cli-region=' + REGION, '--function_urn=' + urn];
    const dp = await call('huaweicloud_plan_cli_command', { args: del, allowWrites: true });
    const dr = await call('huaweicloud_run_approved_command', { args: del, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    cleanup = dr.ok === true;
    console.log('DeleteFunction 归零 -> ok=' + dr.ok);
  }
  check('serviceCatalog 路由 FunctionGraph', fgHit, JSON.stringify(cat.recommendedServices));
  check('创建 Python 函数返回 URN', created, 'urn=' + urn.slice(0, 24));
  check('定时触发器绑定成功', triggerOk, 'triggerOk=' + triggerOk);
  check('测后删除函数归零', cleanup || !created, 'cleanup=' + cleanup + ' (未创建亦视为无残留)');
}
console.log('=====END D3-S6=====');

// ============ D3-S7 场景-跨服务交付(Web 应用 + RDS)并归零 ============
console.log('\n=====CASE D3-S7=====');
{
  const cat = await call('huaweicloud_service_catalog', { intent: '部署一个带 MySQL 数据库的 Web 应用' });
  const svcStr = JSON.stringify(cat.recommendedServices || []).toLowerCase();
  const rdsHit = /rds|mysql|database/.test(svcStr);
  const deployHit = /sandbox|ecs|cce/.test(svcStr);
  console.log('复合意图路由 -> services=' + JSON.stringify(cat.recommendedServices) + ' (RDS命中=' + rdsHit + ' 部署目标命中=' + deployHit + ')');
  // RDS 只读可达性 + 现存实例核查（建立归零基线）
  const listBefore = await call('huaweicloud_run_readonly_command', { args: ['RDS', 'ListInstances', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  console.log('RDS ListInstances -> ok=' + listBefore.ok + ' (基线)' + (listBefore.ok ? '' : ' err=' + redact(listBefore.stdout || '').slice(0, 140)));
  // 尝试最小 RDS MySQL 实例创建（最低配置）
  const instName = 'hdk-s7-' + TS;
  const createArgs = ['RDS', 'CreateInstance', '--cli-region=' + REGION, '--name=' + instName, '--datastore.type=MySQL', '--datastore.version=8.0', '--flavor_ref=rds.mysql.n1.large.1', '--volume.type=ULTRAHIGH', '--volume.size=40', '--availability_zone=cn-north-4a', '--vpc_id=', '--subnet_id=', '--security_group_id=', '--db.password=HdkS7@Test12345', '--db.port=3306'];
  let instanceCreated = false;
  let instanceId = '';
  let blockedReason = '';
  try {
    const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
    console.log('plan RDS CreateInstance -> decision=' + (cp.classification && cp.classification.decision));
    const cr = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 120000 });
    console.log('run RDS CreateInstance -> ok=' + cr.ok + ' stdout=' + redact(cr.stdout || '').slice(0, 180));
    instanceId = idOf(cr.stdout || '', 'instance_id');
    instanceCreated = cr.ok === true && !!instanceId;
    if (!instanceCreated) blockedReason = 'RDS 实例创建未成功(preflight 缺 vpc/subnet/sg 前置或配额): ' + redact(cr.stdout || '').slice(0, 160);
  } catch (e) { blockedReason = 'RDS create 异常: ' + String(e).slice(0, 160); }
  // 清理：删除本次创建的 RDS 实例（若创建成功）
  let cleanup = false;
  if (instanceId) {
    const del = ['RDS', 'DeleteInstance', '--cli-region=' + REGION, '--instance_id=' + instanceId];
    const dp = await call('huaweicloud_plan_cli_command', { args: del, allowWrites: true });
    const dr = await call('huaweicloud_run_approved_command', { args: del, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 120000 });
    cleanup = dr.ok === true;
    console.log('DeleteInstance 归零 -> ok=' + dr.ok);
  }
  check('serviceCatalog 复合意图命中 RDS + 部署目标', rdsHit && deployHit, JSON.stringify(cat.recommendedServices));
  check('RDS API 只读可达', listBefore.ok === true, 'ListInstances ok=' + listBefore.ok);
  if (instanceCreated) {
    check('最小 RDS 实例创建成功', true, 'instanceId=' + instanceId.slice(0, 16));
    check('测后删除本次 RDS 归零', cleanup, 'cleanup=' + cleanup);
  } else {
    check('最小 RDS 实例创建(真·外部依赖: 需 vpc/subnet/sg 前置环境)', false, blockedReason);
    console.log('→ D3-S7 需完整 VPC/子网/安全组前置 + RDS 配额，编排后半段在沙箱内注入连接串；本轮记录真实 blocker');
  }
}
console.log('=====END D3-S7=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));