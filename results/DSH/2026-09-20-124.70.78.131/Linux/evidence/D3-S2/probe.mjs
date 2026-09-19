import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const hc = (a) => spawnSync('hcloud', [...a, '--cli-region=cn-north-4'], { shell:false, encoding:'utf8', timeout:60000 });
const j = (r) => { try { const s=(r.stdout||'').toString(); return JSON.parse(s.slice(s.indexOf('{'))); } catch { return null; } };
let PASS=0,FAIL=0;
function A(id,l,c,d){const ok=!!c;ok?PASS++:FAIL++;const det=d?(' | '+d):'';console.log('['+(ok?'PASS':'FAIL')+'] '+id+' '+l+det);}

const ts = Date.now();
const vpcName = `tctest-dsh-s2-${ts}`;
const cat = await callTool('huaweicloud_service_catalog', {intent:'删除测试VPC，先列出命令让我确认'});
console.log('routing services:', JSON.stringify(cat.recommendedServices));
const svc = (cat.recommendedServices||[]).join(' ');
A('D3-S2','serviceCatalog 路由命中 VPC', /VPC/i.test(svc), svc);

const create = hc(['VPC','CreateVpc','--vpc.name='+vpcName,'--vpc.cidr=10.254.0.0/16']);
const vpcId = j(create)?.vpc?.id || '';
console.log('创建测试 VPC:', vpcName, '| id:', vpcId);

const args = ['VPC','DeleteVpc','--vpc_id='+vpcId];
const plan = await callTool('huaweicloud_plan_cli_command', { args });
console.log('plan decision:', plan.classification?.decision, '| risk:', plan.classification?.risk, '| safeToRun:', plan.safeToRun);
console.log('plan 命令块存在(approvalToken):', !!plan.approvalToken);
A('D3-S2','plan 生成命令块并等待确认(deny+safeToRun=false)', plan.classification?.decision==='deny' && plan.safeToRun===false, plan.classification?.decision+'/'+plan.safeToRun);
A('D3-S2','确认前零执行(VPC 仍存在)', Boolean(j(hc(['VPC','ListVpcs']))?.vpcs?.some(v=>v.id===vpcId)));

const hook = await callTool('huaweicloud_hook_check_command', { command: `hcloud VPC DeleteVpc --vpc_id=${vpcId}` });
console.log('hook_check_command decision:', hook.decision, '| risk:', hook.risk);
A('D3-S2','hook 预检识别写操作(deny/write)', hook.decision==='deny' && hook.risk==='write', hook.decision+'/'+hook.risk);

const run = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
console.log('run_approved result.ok:', run.ok, '| exitCode:', run.exitCode);
const stillExists = Boolean(j(hc(['VPC','ListVpcs']))?.vpcs?.some(v=>v.id===vpcId));
console.log('确认执行后 VPC 仍存在:', stillExists);
A('D3-S2','确认后删除成功且归零', run.ok===true && !stillExists, `run.ok=${run.ok} stillExists=${stillExists}`);
console.log('\n=== 汇总: PASS='+PASS+' FAIL='+FAIL+' ===');
process.exit(FAIL?1:0);
