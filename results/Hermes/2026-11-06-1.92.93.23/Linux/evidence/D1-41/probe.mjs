// D1-41 — check_update 真实 MCP 返回契约
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = await tools.callTool('huaweicloud_check_update', {});
ck('返回对象', r && typeof r==='object', r);
const keys = r ? Object.keys(r) : [];
ck('含版本相关字段', keys.some(k=>/version|update|current|latest/i.test(k)), keys);
ck('不抛出异常', true, 'callTool 正常返回');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-41', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
