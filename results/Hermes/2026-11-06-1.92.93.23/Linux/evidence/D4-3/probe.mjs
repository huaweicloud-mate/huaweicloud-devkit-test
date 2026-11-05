// D4-3 — 明文 secret API 拦截
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = pol.classifyHcloudArgs(['hcloud','CSMS','ShowSecretVersion','--secret_name=x']);
ck('ShowSecretVersion deny', r.decision==='deny' && r.risk==='secret', r);
const r2 = pol.classifyHcloudArgs(['hcloud','DEW','ShowSecret','--secret_name=x']);
ck('ShowSecret deny', r2.decision==='deny', r2);
const r3 = pol.classifyHcloudArgs(['hcloud','KMS','GetSecretValue']);
ck('GetSecretValue deny', r3.decision==='deny', r3);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-3', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
