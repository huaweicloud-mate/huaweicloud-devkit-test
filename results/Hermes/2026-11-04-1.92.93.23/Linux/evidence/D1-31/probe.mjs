// D1-31 — dismiss 冷却期
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const fut = new Date(Date.now()+24*3600*1000).toISOString();
const st = {dismissedVersion:'1.1.12', dismissedAt:new Date().toISOString(), expireAt:fut};
const r = upd.judgeUpdate('1.1.0', {latest:'1.1.12'}, st);
ck('冷却期内 dismissed', r.result==='dismissed', r.result);
ck('dismissExpiresAt 透传', r.dismissExpiresAt===fut, r.dismissExpiresAt);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-31', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
