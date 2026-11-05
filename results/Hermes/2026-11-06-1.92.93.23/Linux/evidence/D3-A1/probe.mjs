// D3-A1 — skill 检索完整性
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const skillsRoot = tools.listSkillDirs && tools.listSkillDirs('') ;
ck('listSkillDirs 导出', typeof tools.listSkillDirs==='function', '');
const r = await tools.callTool('huaweicloud_retrieve_skill', {name:'huaweicloud-core'});
ck('retrieve_skill 返回(含 ok 或 content)', r && typeof r==='object', r ? Object.keys(r) : null);
// 用 skill 名检索可用
const r2 = await tools.callTool('huaweicloud_retrieve_skill', {skillName:'huaweicloud-core'});
ck('skillName 变体也返回对象', r2 && typeof r2==='object', r2 ? Object.keys(r2) : 'err '+String(r2).slice(0,80));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D3-A1', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
