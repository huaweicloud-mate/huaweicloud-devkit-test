// D4-26 — findings 证据脱敏
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const risk = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = risk.evaluateCommandRisk('hcloud ECS CreateServers --adminPass=hunter2secret --count 1');
ck('有 findings', Array.isArray(r.findings) && r.findings.length>0, r.findings && r.findings.length);
if (r.findings && r.findings[0]) {
  ck('evidence 脱敏 secret 值', !/hunter2secret/.test(r.findings[0].evidence||''), (r.findings[0].evidence||'').slice(0,100));
  ck('evidence 保留 <redacted> 标记', /<redacted>/.test(r.findings[0].evidence||''), (r.findings[0].evidence||'').slice(0,100));
}
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-26', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
