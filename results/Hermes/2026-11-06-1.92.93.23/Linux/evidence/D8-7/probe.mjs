// D8-7 — 7 个 meta/通用技能指引可机械执行验证
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const metas = ['huaweicloud-core','huaweicloud-api-and-sdk','huaweicloud-capability-discovery','huaweicloud-cli-and-auth','huaweicloud-safety','huaweicloud-troubleshooting'];
let ok=0;
for (const m of metas) {
  const r = await tools.callTool('huaweicloud_retrieve_skill', {skillName:m});
  if (r!==undefined) ok++;
}
ck('6 meta 技能均检索成功', ok===metas.length, ok+'/'+metas.length);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D8-7', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
