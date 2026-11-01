// D1-33 — skip 文件持久化与多路径
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
// 用独立临时文件验证 writeSkipState/readSkipState 持久化闭环
const tmpfile = '/tmp/.hdkskip-probe-'+process.pid+'.json';
upd.writeSkipState(tmpfile, '1.1.12', {days:3});
const st = upd.readSkipState(tmpfile);
ck('dismissedVersion 持久化', st && st.dismissedVersion==='1.1.12', st);
ck('expireAt 存在', st && !!st.expireAt, st && st.expireAt);
ck('冷却期约3天', st && (new Date(st.expireAt)-new Date(st.dismissedAt)) >= 2*24*3600*1000, st && (new Date(st.expireAt)-new Date(st.dismissedAt)));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-33', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
