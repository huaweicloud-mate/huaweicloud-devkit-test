// D4-7 — hook 三工具有效性
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const hooks = ['huaweicloud_hook_check_command','huaweicloud_hook_check_artifacts','huaweicloud_hook_check_deploy_plan'];
let ok=0;
for (const h of hooks) if (tools.TOOL_DEFINITIONS.some(t=>t.name===h)) ok++;
ck('3 个 hook 工具均注册', ok===3, ok+'/3');
const r = await tools.callTool('huaweicloud_hook_check_command', {command:'hcloud ECS DeleteServers --server_id=x --delete_volume'});
ck('hook_check_command 返回 decision', r && typeof r.decision==='string', r && r.decision);
ck('破坏性删除触发 findings', r && Array.isArray(r.findings) && r.findings.length>0, r && r.findings && r.findings.map(f=>f.ruleId));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-7', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
