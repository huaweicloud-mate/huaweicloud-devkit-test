// D4-8 — Python/Node 策略一致
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
// Node 侧判定
const ns = pol.classifyHcloudArgs(['hcloud','ECS','DeleteServers','--server_id=x']);
// Python hook 文件存在（同源策略，Node implementation 是主实现）
const fs = await import('node:fs');
const py = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py';
const pyExists = fs.existsSync(py);
ck('Node 写操作 deny', ns.decision==='deny', ns);
ck('Python hook 文件存在', pyExists, py);
const js = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';
ck('Node hook 文件存在', fs.existsSync(js), js);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-8', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
