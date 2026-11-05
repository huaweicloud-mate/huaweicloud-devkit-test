// EXP-D5-8-1 — Hermes 上执行 D5-1 (清单发现加载)
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const names = tools.TOOL_DEFINITIONS.map(t=>t.name);
ck('Hermes 工具清单完整', names.length>=45, names.length);
ck('核心工具存在', ['huaweicloud_service_catalog','huaweicloud_retrieve_skill','huaweicloud_auth_status'].every(n=>names.includes(n)), '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'EXP-D5-8-1', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
