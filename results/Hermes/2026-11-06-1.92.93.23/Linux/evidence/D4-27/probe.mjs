// D4-27 — 双路径输出脱敏
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const hc = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('redactOutput 导出', typeof hc.redactOutput==='function', '');
const r = hc.redactOutput('server ready, AK=HPUAN1REALSECRET sk=supersecret');
ck('AK/SK 脱敏', !/HPUAN1REALSECRET/.test(r) && !/supersecret/.test(r), r.slice(0,120));
ck('redactArgsWithObs 导出', typeof hc.redactArgsWithObs==='function', '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-27', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
