// D3-S3 — 场景-沙箱预览出 URL
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('sandbox_deploy_check 工具存在', tools.TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_sandbox_deploy_check'), '');
ck('sandbox_expose_tunnel 工具存在', tools.TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_sandbox_expose_tunnel'), '');
ck('sandbox_renew_tunnel 工具存在', tools.TOOL_DEFINITIONS.some(t=>t.name==='huaweicloud_sandbox_renew_tunnel'), '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D3-S3', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
