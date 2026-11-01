// D4-20 — 拒绝后零操作
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const hc = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('planHcloudCommand 存在', typeof hc.planHcloudCommand==='function', '');
const p = hc.planHcloudCommand(['hcloud','ECS','ListServers']);
ck('plan 返回对象', p && typeof p==='object', typeof p);
const pw = hc.planHcloudCommand(['hcloud','ECS','DeleteServers','--server_id=x']);
ck('写操作 plan 标记不可直接执行', pw && (pw.safeToRun===false || (pw.classification && pw.classification.decision==='deny')), pw && (pw.safeToRun ?? pw.classification));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-20', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
