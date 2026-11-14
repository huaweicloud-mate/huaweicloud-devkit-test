import { pathToFileURL } from 'node:url';

// D3-S6 场景-FunctionGraph 定时任务（探针修正版 2026-11-15）
// 修正点：① KooCLI 参数名 --func_name（非 --function_name）、内联代码用 --code_type=inline + --func_code.file
//        ② func_urn 含冒号，改为 JSON 字段直取（原 idOf 正则只允许 [0-9a-zA-Z-]）
//        ③ DeleteFunction 需去 :latest 版本后缀（带版本会 FSS.0400）
//        ④ 触发器改为真查 ListFunctionTriggers 断言，不再仅凭 run ok 判 PASS
const CORE = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const REGION = 'cn-north-4';
const TS = Date.now().toString(36).slice(-8);
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 600) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + String(detail).slice(0, 240) : ''}`);
}
function redact(s) {
  return String(s).replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***');
}
async function call(name, args) {
  try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 300) }; }
}

const fnName = 'hdk-s6-' + TS;
const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');

// ① 路由
const cat = await call('huaweicloud_service_catalog', { intent: '部署 Python 函数，每天定时执行' });
const svc = JSON.stringify(cat.recommendedServices || []).toLowerCase();
const fgHit = /functiongraph/.test(svc);
console.log('路由 -> ' + JSON.stringify({ skills: cat.recommendedSkills, services: cat.recommendedServices }));
check('serviceCatalog 路由 FunctionGraph', fgHit, JSON.stringify(cat.recommendedServices));

// ② 创建函数（最低配置）
const createArgs = ['FunctionGraph', 'CreateFunction', '--cli-region=' + REGION,
  '--func_name=' + fnName, '--package=default', '--runtime=Python3.10', '--handler=index.handler',
  '--code_type=inline', '--func_code.file=' + code, '--timeout=3', '--memory_size=128'];
let urn = '';
let created = false;
const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
console.log('plan CreateFunction -> decision=' + (cp.classification && cp.classification.decision) +
  ' safeToRun=' + cp.safeToRun + ' (最小配置：128MB/3s/inline 代码)');
const cr = await call('huaweicloud_run_approved_command',
  { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
console.log('run CreateFunction -> ok=' + cr.ok + ' stdout=' + redact(cr.stdout || '').slice(0, 200));
urn = (/"func_urn"\s*:\s*"([^"]+)"/.exec(cr.stdout || '') || [])[1] || '';
created = cr.ok === true && !!urn;
check('创建 Python 函数返回 URN', created, 'urn=' + urn);

// ③ 定时触发器（TIMER）
let triggerOk = false;
let trigList = '';
if (created) {
  // KooCLI 7.2.12 的 CreateFunctionTrigger 采用扁平参数（--event_data.<key>），不接受 event_data JSON blob
  const trg = ['FunctionGraph', 'CreateFunctionTrigger', '--cli-region=' + REGION, '--function_urn=' + urn,
    '--trigger_type_code=TIMER', '--trigger_status=ACTIVE',
    '--event_data.name=' + fnName + '-timer', '--event_data.schedule=0 0 2 * * ?', '--event_data.schedule_type=Cron'];
  const tp = await call('huaweicloud_plan_cli_command', { args: trg, allowWrites: true });
  const tr = await call('huaweicloud_run_approved_command',
    { args: trg, approvalToken: tp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
  console.log('CreateFunctionTrigger -> ok=' + tr.ok + ' stdout=' + redact(tr.stdout || '').slice(0, 160).replace(/\n/g, ' '));
  // 真查触发器列表
  const lv = await call('huaweicloud_run_readonly_command',
    { args: ['FunctionGraph', 'ListFunctionTriggers', '--cli-region=' + REGION,
      '--function_urn=' + urn.replace(/:latest$/, ''), '--cli-output=json'], timeoutMs: 60000 });
  trigList = redact(lv.stdout || '').slice(0, 300).replace(/\n/g, ' ');
  console.log('ListFunctionTriggers -> ok=' + lv.ok + ' body=' + trigList);
  triggerOk = tr.ok === true && /TIMER/i.test(lv.stdout || '');
}
check('定时触发器绑定成功', triggerOk, 'triggers=' + trigList);

// ④ 删除归零 + 复核
let cleanup = false;
if (urn) {
  const urnNoVer = urn.replace(/:latest$/, '');
  const del = ['FunctionGraph', 'DeleteFunction', '--cli-region=' + REGION, '--function_urn=' + urnNoVer];
  const dp = await call('huaweicloud_plan_cli_command', { args: del, allowWrites: true });
  const dr = await call('huaweicloud_run_approved_command',
    { args: del, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
  await new Promise((r) => setTimeout(r, 5000));
  const lf = await call('huaweicloud_run_readonly_command',
    { args: ['FunctionGraph', 'ListFunctions', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  const residual = (lf.stdout || '').includes(fnName);
  cleanup = dr.ok === true && !residual;
  console.log('DeleteFunction 归零 -> ok=' + dr.ok + ' 列表残留=' + residual);
}
check('测后删除函数归零', cleanup || !created, 'cleanup=' + cleanup + ' (未创建亦视为无残留)');

const passed = results.filter((r) => r.ok).length;
console.log('\n===== SUMMARY =====');
console.log(JSON.stringify({ case: 'D3-S6', total: results.length, passed, status: passed === results.length ? 'PASS' : 'FAIL', executedAt: new Date().toISOString(), results }, null, 2));