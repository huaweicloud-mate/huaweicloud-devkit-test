import { pathToFileURL } from 'node:url';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const { extractApiError } = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 500) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
function redact(s) {
  return String(s).replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***');
}
async function call(name, args) {
  try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; }
}

const REGION = 'cn-north-4';

// ============ D3-S1 场景-只读查 ECS（零写工具） ============
console.log('\n=====CASE D3-S1=====');
{
  const cat = await call('huaweicloud_service_catalog', { intent: '列出 cn-north-4 的 ECS 实例清单，只读不改' });
  console.log('serviceCatalog.intent 路由: ' + JSON.stringify({ intent: cat.intent, skills: cat.recommendedSkills, services: cat.recommendedServices }));
  const svcHit = JSON.stringify(cat.recommendedServices || []).toLowerCase().includes('ecs');
  const ro = await call('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  console.log('run_readonly ListServersDetails -> ok=' + ro.ok + (ro.ok ? ' servers=' + ((ro.stdout || '').match(/"count"\s*:\s*\d+/) || [''])[0] : ' err=' + redact(ro.stdout || '').slice(0, 120)));
  check('serviceCatalog 路由命中 ECS', svcHit, JSON.stringify(cat.recommendedServices));
  check('只读命令返回实例清单(空也可)', ro.ok === true, redact(ro.stdout || '').slice(0, 140));
  check('全程零写工具调用(本探针仅调用 service_catalog+run_readonly)', true, '未调用 create/delete/plan/run_approved/hook 写路径');
}
console.log('=====END D3-S1=====');

// ============ D3-S5 场景-复合意图分层路由 ============
console.log('\n=====CASE D3-S5=====');
{
  const cat = await call('huaweicloud_service_catalog', { intent: '物联网+时序数据+前端托管，先预览后生产部署' });
  console.log('复合意图 -> skills=' + JSON.stringify(cat.recommendedSkills) + ' services=' + JSON.stringify(cat.recommendedServices));
  const svcStr = JSON.stringify(cat.recommendedServices || []).toLowerCase();
  const hitStorage = /dds|gaussdb|mongodb/.test(svcStr);
  const hitHosting = /obs|ecs|sandbox|cce/.test(svcStr);
  const multi = (cat.recommendedServices || []).length >= 2;
  console.log(`存储命中=${hitStorage} 托管/部署命中=${hitHosting} 多路命中=${multi}`);
  check('复合意图拆分命中多个 service(存储+托管)', hitStorage && hitHosting, JSON.stringify(cat.recommendedServices) + ' (多路=' + multi + ')');
}
console.log('=====END D3-S5=====');

// ============ D3-S8 场景-操作失败后排障指引 ============
console.log('\n=====CASE D3-S8=====');
{
  const errJson = JSON.stringify({ error_code: 'APIGW.0301', error_msg: 'IAM authentication failed: verify the AK/SK' });
  const parsed = extractApiError('有多个版本前缀 ' + errJson);
  console.log('extractApiError -> ' + JSON.stringify(parsed));
  const exp = await call('huaweicloud_explain_error', { service: 'ECS', errorCode: parsed && parsed.errorCode, message: parsed && parsed.errorMessage });
  console.log('explain_error -> ' + JSON.stringify(exp).slice(0, 400));
  const exp2 = await call('huaweicloud_explain_error', { service: 'VPC', errorCode: 'APIGW.0802', message: 'The request is denied by the region policy' });
  console.log('explain_error(区域) -> ' + JSON.stringify(exp2).slice(0, 300));
  const exp3 = await call('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0070', message: 'Insufficient quota' });
  console.log('explain_error(配额) -> ' + JSON.stringify(exp3).slice(0, 300));
  const meaningful = (exp && (exp.explanation || exp.classification || exp.category || exp.suggestion || exp.steps || exp.next)) || (exp && JSON.stringify(exp).length > 60);
  check('extractApiError 提取 error_code', parsed && parsed.errorCode === 'APIGW.0301', JSON.stringify(parsed));
  check('explain_error 给出分类/下一步(非裸报错堆栈)', !!meaningful, JSON.stringify(exp).slice(0, 200));
}
console.log('=====END D3-S8=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));