// D3-C6 — 沙箱 7 隐式工具具名冒烟
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const sb = ['huaweicloud_sandbox_check_user','huaweicloud_sandbox_credentials','huaweicloud_sandbox_connect','huaweicloud_sandbox_sign_agreement','huaweicloud_sandbox_exec_one_shot','huaweicloud_sandbox_close_session','huaweicloud_sandbox_upload_file'];
let present=0;
for (const n of sb) if (tools.TOOL_DEFINITIONS.some(t=>t.name===n)) present++;
ck('7 沙箱工具均具名存在', present===7, present+'/7');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D3-C6', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
