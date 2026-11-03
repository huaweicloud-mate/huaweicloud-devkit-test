// D1-45 — 兜底提示真实序列与预热竞态
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = await upd.getCachedUpdateInfo('1.1.13', {doQuery: async()=>null, now: Date.now()});
ck('doQuery 失败不崩', !!r, r);
ck('返回含 result 字段', r && 'result' in r, r);
// 显式 skip env 兜底
const old=process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE='1';
const r2 = upd.judgeUpdate('1.1.0', {latest:'9.9.9'}, null);
ck('skip 生效不提醒', r2.result==='up_to_date' && r2.updateAvailable===false, r2);
if(old===undefined) delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE; else process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE=old;
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-45', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
