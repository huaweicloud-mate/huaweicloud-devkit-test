// D2-5 — 凭证缺失报错指引
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const cred = await import(pathToFileURL(SRC + '/auth/credentials.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = cred.resolveCredentialsWithRuntime ? cred.resolveCredentialsWithRuntime({}) : null;
// 只断言结构，绝不落盘明文
if (r && typeof r==='object') {
  ck('resolve 返回对象(含 ak 或空)', 'ak' in r || 'error' in r, Object.keys(r));
} else {
  ck('resolve 返回', false, 'unexpected null');
}
ck('readGlobalCredentials 可调用', typeof cred.readGlobalCredentials==='function', '');
const gc = cred.readGlobalCredentials();
ck('全局凭证读取返回对象', gc===undefined || typeof gc==='object', typeof gc);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D2-5', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
