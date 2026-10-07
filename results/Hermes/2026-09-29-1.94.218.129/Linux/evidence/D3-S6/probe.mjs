// D3-S6 场景-FunctionGraph定时任务 (真云实测: 建函数+定时触发器+核对URN/触发器+删除归零)
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-29-1.94.218.129/Linux/evidence/D3-S6/stdout.log';
const REGION = process.env.HW_REGION || 'cn-north-4';
const PROJECT = '46c1fd48bd1248c7b75afc3780de7132';
const TS = String(Date.now()).slice(-10);
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected) });
}
function sh(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 120000 });
  return (r.stdout || '') + (r.stderr || '');
}
const urnOf = (name) => `urn:fss:${REGION}:${PROJECT}:function:default:${name}`;
const fnName = `hdk1-s6-${TS}`;

// ① serviceCatalog 路由
let catTxt = '';
try {
  const cat = await callTool('huaweicloud_service_catalog', { intent: '配置一个定时任务，定时触发函数' });
  catTxt = cat?.result?.content?.[0]?.text ?? cat?.content?.[0]?.text ?? JSON.stringify(cat);
} catch (e) { catTxt = `err:${e.message}`; }
let routedFg = false;
try { const svc = JSON.parse(catTxt).recommendedServices || []; routedFg = svc.some(s => /functiongraph|fgs|函数/i.test(s)); } catch {}
test('D3-S6', 'serviceCatalog-route-fg', routedFg, catTxt.slice(0, 120), 'serviceCatalog 路由命中 FunctionGraph');

// ② 建函数 (inline, base64)
const code = Buffer.from("def handler(event, context):\n    return {'statusCode': 200, 'body': 'hdk-d3s6'}\n").toString('base64');
const cf = sh(['FunctionGraph', 'CreateFunction', `--func_name=${fnName}`, '--package=default', '--runtime=Python3.9', '--handler=index.handler', '--memory_size=128', '--timeout=3', '--code_type=inline', `--func_code.file=${code}`, `--cli-region=${REGION}`]);
const created = /"func_urn"/.test(cf) || /success/i.test(cf);
test('D3-S6', 'create-function', created, cf.slice(0, 160).replace(/[A-Z0-9]{20,}/g, '***'), 'CreateFunction 返回 func_urn');

// ③ 建定时触发器
let trigOk = false, trigRaw = '';
if (created) {
  const ct = sh(['FunctionGraph', 'CreateFunctionTrigger', `--function_urn=${urnOf(fnName)}`, '--trigger_type_code=TIMER', '--event_data.name=test-timer', '--event_data.schedule_type=Rate', '--event_data.schedule=1m', `--cli-region=${REGION}`]);
  trigRaw = ct;
  trigOk = /"trigger_id"/.test(ct) || /success/i.test(ct);
}
test('D3-S6', 'create-timer-trigger', trigOk, trigRaw.slice(0, 160), 'CreateFunctionTrigger TIMER 成功');

// ④ 核对函数 URN + 触发器绑定
let urnOk = false, trigBound = false;
if (created) {
  const lf = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
  urnOk = lf.includes(fnName) && lf.includes(`function:default:${fnName}`);
  const lt = sh(['FunctionGraph', 'ListFunctionTriggers', `--function_urn=${urnOf(fnName)}`, `--cli-region=${REGION}`]);
  trigBound = /TIMER/i.test(lt) && !/\[\]/.test(lt.trim());
}
test('D3-S6', 'verify-urn', urnOk, `urnOk=${urnOk}`, 'ListFunctions 含新建函数 URN');
test('D3-S6', 'verify-trigger-bound', trigBound, `trigBound=${trigBound}`, 'ListFunctionTriggers 含 TIMER 触发器');

// ⑤ 删除归零
let gone = true;
if (created) {
  const df = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${urnOf(fnName)}`, `--cli-region=${REGION}`]);
  const after = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
  gone = !after.includes(fnName);
  test('D3-S6', 'delete-zero', gone, `delete=${/success|^\\s*$/i.test(df)} gone=${gone}`, 'DeleteFunction 后 ListFunctions 不再含(归零)');
} else {
  test('D3-S6', 'delete-zero', true, '未创建(跳过删除)', '归零');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);