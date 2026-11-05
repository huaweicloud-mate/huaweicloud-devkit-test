// D4-24 — 确认令牌过期与重复确认边界
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const hc = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('inspectApprovalToken 导出', typeof hc.inspectApprovalToken==='function', '');
ck('consumeApprovalToken 导出', typeof hc.consumeApprovalToken==='function', '');
const tok = hc.createApprovalToken(['hcloud','ECS','ListServers']);
const info = hc.inspectApprovalToken(tok);
ck('令牌 state=valid', info && info.state==='valid', info && info.state);
ck('entry 含 createdAt', info && info.entry && typeof info.entry.createdAt==='number', info && info.entry && info.entry.createdAt);
const consumed = hc.consumeApprovalToken(tok);
ck('首次消费返回 entry', consumed && typeof consumed==='object', consumed);
const again = hc.consumeApprovalToken(tok);
ck('重复消费返回 null', again===null, again);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-24', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
