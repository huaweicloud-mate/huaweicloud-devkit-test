// EXP-C4-06 — CCE 只读规划冒烟 (list_operations+plan)
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = await tools.callTool('huaweicloud_list_operations', {service:'CCE'});
ck('list_operations CCE 返回 service', r && r.service === 'CCE', r && r.service);
ck('返回 command 或聚合子服务', (r && typeof r.command==='string' && r.command.length>0) || (r && r.aggregate===true && Array.isArray(r.subServices) && r.subServices.length>0), r && (r.command || (r.aggregate===true ? 'aggregate:'+r.subServices.length : 'missing')));
const p = await tools.callTool('huaweicloud_plan_cli_command', {args:['hcloud','CCE','--help']});
ck('plan_cli_command CCE 返回对象', p && typeof p==='object', typeof p);
const pass = checks.every(c=>c.ok);
const result = {caseId:'EXP-C4-06', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
