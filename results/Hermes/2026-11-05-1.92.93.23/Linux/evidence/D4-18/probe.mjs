// D4-18 — confirm-not-deny 审批语义
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = await tools.callTool('huaweicloud_plan_cli_command', {args:['hcloud','ECS','CreateServers','--count','1']});
ck('写操作 plan 返回 deny', r && r.classification && r.classification.decision==='deny', r && r.classification);
ck('risk==write 需审批', r && r.classification && r.classification.risk==='write', r && r.classification && r.classification.risk);
ck('safeToRun=false', r && r.safeToRun===false, r && r.safeToRun);
ck('生成审批令牌', r && typeof r.approvalToken==='string' && r.approvalToken.length>0, r && !!r.approvalToken);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-18', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
