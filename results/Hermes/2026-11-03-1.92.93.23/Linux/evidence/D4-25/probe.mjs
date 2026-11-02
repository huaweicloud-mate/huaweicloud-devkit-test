// D4-25 — Python hook 事件遥测分类
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const fs = await import('node:fs');
const hj = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks/hooks.json';
const hjson = fs.existsSync(hj) ? JSON.parse(fs.readFileSync(hj,'utf8')) : null;
ck('hooks.json 存在', !!hjson, hj);
const hm = JSON.stringify(hjson || {});
ck('注册 .mjs Node 实现', /huaweicloud-safety\.mjs/.test(hm), 'node hook wired');
// 分类三态映射到遥测事件类：read_only / write / not_huaweicloud
const rd = pol.classifyHcloudArgs(['hcloud','ECS','ListServers']);
ck('只读→read_only 分类', rd.risk==='read_only', rd.risk);
const wr = pol.classifyHcloudArgs(['hcloud','ECS','DeleteServers']);
ck('写→write 分类', wr.risk==='write', wr.risk);
const ot = pol.classifyTextCommand('ls -la /tmp');
ck('其他→not_huaweicloud 分类', ot.risk==='not_huaweicloud', ot.risk);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-25', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
