// D4-28 — Node 版安全 hook 链路
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const fs = await import('node:fs');
const hj = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks/hooks.json';
const hm = fs.existsSync(hj) ? fs.readFileSync(hj,'utf8') : '';
ck('hooks.json 注册 .mjs', /huaweicloud-safety\.mjs/.test(hm), '');
// tool_input 中 command 字段提取
const hi = pol.classifyTextCommand('echo $HW_SECRET_KEY');
ck('command 字段内凭证被 deny', hi.decision==='deny', hi);
const wr = pol.classifyTextCommand('hcloud ECS DeleteServers --server_id=x');
ck('高危写命令 deny', wr.decision==='deny' && wr.risk==='write', wr);
const rd2 = pol.classifyTextCommand('hcloud ECS ListServersDetails');
ck('非高危无 deny 输出', rd2.decision==='allow', rd2);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-28', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
