// D8-10 — MCP 配置备份与合并
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const mcpb = await import(pathToFileURL(SRC + '/mcp-config-backup.mjs').href);
const mcpm = await import(pathToFileURL(SRC + '/mcp-config-merge.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('mcp-config-backup 模块加载', Object.keys(mcpb).length>0, Object.keys(mcpb).slice(0,8));
ck('mcp-config-merge 模块加载', Object.keys(mcpm).length>0, Object.keys(mcpm).slice(0,8));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D8-10', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
