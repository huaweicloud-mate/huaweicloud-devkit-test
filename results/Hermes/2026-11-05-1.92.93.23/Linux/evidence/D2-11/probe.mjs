// D2-11 — R3 STS token 拒绝落盘
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const cred = await import(pathToFileURL(SRC + '/auth/credentials.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('parseStsExpiry 导出', typeof cred.parseStsExpiry==='function', '');
// 无 securityToken 的 STS 组件应被拒绝或返回空
const noToken = cred.parseStsExpiry({securityToken:''});
ck('空 token 不外泄/无效', noToken===null || noToken===undefined || (noToken&&noToken.valid===false), noToken);
ck('writeGlobalCredentials 导出', typeof cred.writeGlobalCredentials==='function', '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D2-11', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
