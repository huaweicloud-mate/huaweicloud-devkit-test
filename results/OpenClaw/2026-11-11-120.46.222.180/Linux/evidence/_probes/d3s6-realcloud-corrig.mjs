#!/usr/bin/env node
// D3-S6 场景-FunctionGraph 定时任务 — 真云建删归零（修正参数名）
// 修正：--func_name（非 --function_name），--code_type=inline + --func_code.file(base64)，--handler 含点。
import { pathToFileURL } from 'node:url';

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

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
const out = [];
function check(name, ok, detail) { out.push({ name, ok, detail: String(detail).slice(0,600) }); console.log(`[${ok?'OK':'FAIL'}] ${name}`); }

console.log('\n=====CASE D3-S6 (corrig)=====');
const cat = await call('huaweicloud_service_catalog', { intent: '部署 Python 函数，每天定时执行' });
const svcStr = JSON.stringify(cat.recommendedServices || []).toLowerCase();
console.log('路由 -> ' + JSON.stringify({ skills: cat.recommendedSkills, services: cat.recommendedServices }));
const fgHit = /functiongraph|serverless/.test(svcStr) || /functiongraph/.test(JSON.stringify(cat.recommendedSkills || []).toLowerCase());

const fnName = 'hdk-s6-' + TS;
const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'ok'}\n").toString('base64');
const createArgs = ['FunctionGraph', 'CreateFunction', '--cli-region=' + REGION,
  '--func_name=' + fnName, '--package=default', '--runtime=Python3.10', '--handler=index.handler',
  '--memory_size=128', '--timeout=3', '--code_type=inline', '--func_code.file=' + code];
let urn = ''; let created = false;
try {
  const cp = await call('huaweicloud_plan_cli_command', { args: createArgs, allowWrites: true });
  console.log('plan CreateFunction -> decision=' + (cp.classification && cp.classification.decision));
  const cr = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: cp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
  console.log('run CreateFunction -> ok=' + cr.ok + ' stdout=' + redact(cr.stdout || '').slice(0, 300));
  urn = idOf(cr.stdout || '', 'func_urn');
  created = cr.ok === true && !!urn;
} catch (e) { console.log('FG create exception: ' + String(e).slice(0, 200)); }

let triggerOk = false;
if (created) {
  const trg = ['FunctionGraph', 'CreateFunctionTrigger', '--cli-region=' + REGION, '--function_urn=' + urn,
    '--trigger_type_code=TIMER', '--event_type_code=MessageCreated', '--trigger_status=ACTIVE',
    '--event_data=' + JSON.stringify({ schedule_type: 'Rate', schedule: '0 0 2 * * ?' })];
  try {
    const tp = await call('huaweicloud_plan_cli_command', { args: trg, allowWrites: true });
    const tr = await call('huaweicloud_run_approved_command', { args: trg, approvalToken: tp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    console.log('CreateFunctionTrigger -> ok=' + tr.ok + ' stdout=' + redact(tr.stdout || '').slice(0, 200));
    triggerOk = tr.ok === true;
  } catch (e) { console.log('trigger exception: ' + String(e).slice(0, 200)); }
}

let cleanup = false;
if (urn) {
  const del = ['FunctionGraph', 'DeleteFunction', '--cli-region=' + REGION, '--function_urn=' + urn];
  try {
    const dp = await call('huaweicloud_plan_cli_command', { args: del, allowWrites: true });
    const dr = await call('huaweicloud_run_approved_command', { args: del, approvalToken: dp.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    cleanup = dr.ok === true;
    console.log('DeleteFunction 归零 -> ok=' + dr.ok);
  } catch (e) { console.log('del exception: ' + String(e).slice(0, 200)); }
}

check('serviceCatalog 路由 FunctionGraph', fgHit, JSON.stringify(cat.recommendedServices));
check('创建 Python 函数返回 URN', created, 'urn=' + urn.slice(0, 32) + ' ok=' + created);
check('定时触发器绑定成功', triggerOk, 'triggerOk=' + triggerOk);
check('测后删除函数归零', cleanup || !created, 'cleanup=' + cleanup + ' created=' + created);

console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), total: out.length, passed: out.filter(o=>o.ok).length, failed: out.filter(o=>!o.ok).length, results: out }, null, 2));