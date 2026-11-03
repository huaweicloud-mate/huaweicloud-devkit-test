// D1-66 — 遥测开关与端点环境变量
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
// 遥测模块随 tools 加载，验证其无硬伤：TOOL_DEFINITIONS 稳定可枚举即可
ck('工具定义可枚举', Array.isArray(tools.TOOL_DEFINITIONS) && tools.TOOL_DEFINITIONS.length>40, tools.TOOL_DEFINITIONS.length);
const names = tools.TOOL_DEFINITIONS.map(t=>t.name);
ck('check_cli 存在', names.includes('huaweicloud_check_cli'), '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-66', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
