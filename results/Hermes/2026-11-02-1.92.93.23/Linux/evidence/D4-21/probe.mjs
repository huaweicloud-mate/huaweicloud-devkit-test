// D4-21 — hook_check_artifacts 具名回归
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
const risk = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = await tools.callTool('huaweicloud_hook_check_artifacts', {artifacts:[{path:'main.tf', content:'resource "huaweicloud_networking_secgroup_rule" "r" { remote_ip_prefix="0.0.0.0/0" ports="22" }'}]});
ck('artifacts 检查返回', r && typeof r==='object', typeof r);
const s = JSON.stringify(r);
ck('检出公开暴露', /deny|public|0\.0\.0\.0|warn/i.test(s), s.slice(0,150));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-21', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
