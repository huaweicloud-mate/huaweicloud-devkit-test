// D3-C4 — 服务创建类回归
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const svc = ['ECS','VPC','OBS','RDS','CCE','FunctionGraph','IAM','SMN','DMS','EVS','EIP','ELB'];
let ok=0;
for (const s of svc) {
  const r = await tools.callTool('huaweicloud_list_operations', {service:s});
  if (r && r.service) ok++;
}
ck('多服务 list_operations 可用', ok===svc.length, ok+'/'+svc.length);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D3-C4', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
