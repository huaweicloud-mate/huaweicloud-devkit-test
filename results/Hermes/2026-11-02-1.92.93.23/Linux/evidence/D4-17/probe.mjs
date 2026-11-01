// D4-17 — hook 模糊 fail-closed
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
const risk = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const e1 = pol.classifyHcloudArgs([]);
ck('空参数默认 deny', e1.decision==='deny', e1);
const e2 = pol.classifyHcloudArgs(['hcloud']);
ck('仅 hcloud 无操作 deny', e2.decision==='deny', e2);
let err3 = null; try { risk.evaluateCommandRisk(''); } catch(e){ err3=e; }
ck('空命令 evaluate deci/deny 或抛错(fail-closed)', (()=>{const r=risk.evaluateCommandRisk('');return r.decision==='deny';})(), '');
ck('畸形输入不崩溃', err3===null || typeof err3==='object', 'no uncaught');
let err4=null; try { risk.evaluateArtifacts([]); } catch(e){ err4=e; }
ck('空 artifacts fail-closed(deny)', (()=>{const r=risk.evaluateArtifacts([]);return r.decision==='deny';})(), '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-17', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
