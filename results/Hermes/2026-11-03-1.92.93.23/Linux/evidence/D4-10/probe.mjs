// D4-10 — 规则库新增回归
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const risk = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const catalog = risk.loadRiskRules();
ck('规则库可加载', catalog && Array.isArray(catalog.rules), catalog && Object.keys(catalog));
ck('规则数>=19', catalog.rules.length>=19, catalog.rules.length);
ck('规则含 id/severity/stages', catalog.rules.every(r=>r.id && r.severity && r.stages), '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-10', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
