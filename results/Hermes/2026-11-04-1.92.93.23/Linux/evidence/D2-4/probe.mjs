// D2-4 — 凭证脱敏正确性
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = pol.redactSecrets({ak:'AKIA0123456789', sk:'SECRETSKSECRET', password:'p@ssw0rd', region:'cn-north-4', name:'keep'});
ck('ak 脱敏', r.ak==='<redacted>', r.ak);
ck('sk 脱敏', r.sk==='<redacted>', r.sk);
ck('password 脱敏', r.password==='<redacted>', r.password);
ck('非敏感字段保留', r.region==='cn-north-4' && r.name==='keep', r);
const s = pol.redactSecrets('access_key=REALVALUE secret_key=SECRETVALUE');
ck('字符串 key=value 脱敏', !s.includes('REALVALUE') && !s.includes('SECRETVALUE'), s);
const nested = pol.redactSecrets({credential:{ak:'X', sk:'Y'}, tags:'a'});
ck('嵌套敏感 key 整值脱敏', nested.credential==='<redacted>', JSON.stringify(nested));
ck('非敏感嵌套保留', nested.tags==='a', JSON.stringify(nested));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D2-4', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
