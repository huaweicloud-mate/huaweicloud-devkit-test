// D1-27 — 检测语义-已是最新
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('up_to_date', upd.judgeUpdate('1.1.12', {latest:'1.1.12'}, null).result==='up_to_date', upd.judgeUpdate('1.1.12',{latest:'1.1.12'},null));
ck('无 updateAvailable', upd.judgeUpdate('1.1.12', {latest:'1.1.12'}, null).updateAvailable===false, upd.judgeUpdate('1.1.12',{latest:'1.1.12'},null));
ck('旧版本不误报已最新', upd.judgeUpdate('1.1.0', {latest:'1.1.12'}, null).result==='update_available', null);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-27', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
