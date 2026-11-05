// D1-40 — 镜像 lag 下检测正确性(反向提醒防护)
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
// 镜像滞后：latest 仍是旧版本，不得误报有新版本
const r1 = upd.judgeUpdate('1.1.13', {latest:'1.1.12', next:null}, null);
ck('镜像滞后不误报', r1.result==='up_to_date', r1);
// 无有效 dist-tags → check_failed 不崩
const r2 = upd.judgeUpdate('1.1.13', {latest:null, next:null}, null);
ck('空 dist-tags check_failed', r2.result==='check_failed', r2);
ck('null distTags 不崩', upd.judgeUpdate('1.1.13', null, null).result==='check_failed', upd.judgeUpdate('1.1.13',null,null));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-40', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
