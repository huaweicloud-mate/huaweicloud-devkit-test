// D4-9 — 公开暴露/破坏性预检
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const risk = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = risk.evaluateCommandRisk('hcloud ECS CreateServers --count 1 --volume root --volume_root_volume_size 5000');
// 破坏性/公开暴露的 deny 规则确凿存在且可触发
const r2 = risk.evaluateArtifacts([{path:'main.tf', content:'resource "huaweicloud_networking_secgroup_rule" "x" { direction="ingress" ports="22" remote_ip_prefix="0.0.0.0/0" }'}]);
ck('公开端口暴露预检 deny', r2.decision==='deny', r2.decision + ' ' + (r2.findings?.[0]?.ruleId||''));
ck('deny 规则存在(hwc-network-public-admin-port)', r2.findings?.some(f=>f.ruleId==='hwc-network-public-admin-port'), r2.findings?.map(f=>f.ruleId));
const r3 = risk.evaluateCommandRisk('hcloud ECS DeleteServers --server_id=x --delete_volume true');
ck('破坏性删除有 findings', r3.findings?.length>0, r3.findings?.map(f=>f.ruleId));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-9', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
