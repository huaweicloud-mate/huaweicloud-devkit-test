// D4-19 — 确认流下预检仍生效
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const risk = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = risk.evaluateArtifacts([{path:'x.tf', content:'resource "huaweicloud_ecs_instance" "s" { admin_pass = "plainpass" }'}]);
ck('确认流预检仍查 adminPass', r.decision!=='allow', r.decision + ' ' + (r.findings?.[0]?.ruleId||''));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-19', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
