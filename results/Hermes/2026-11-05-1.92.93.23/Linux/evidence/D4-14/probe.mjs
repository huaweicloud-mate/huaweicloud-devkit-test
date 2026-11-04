// D4-14 — 操作可审计性
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const hc = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('hashArgs 导出', typeof hc.hashArgs==='function', '');
ck('createApprovalToken 导出', typeof hc.createApprovalToken==='function', '');
const tok = hc.createApprovalToken ? hc.createApprovalToken(['hcloud','ECS','ListServers']) : null;
ck('审批令牌可生成', !!tok, typeof tok);
if (tok && hc.inspectApprovalToken) {
  const info = hc.inspectApprovalToken(tok);
  ck('令牌可解析', info && typeof info==='object', info);
}
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-14', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
