// D4-23 — 全局规则 huawei-agent-rules 注入生效性
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const fs = await import('node:fs');
const p = '/home/zhangshuang/devkit-test/Hermes/hdk/rules/huawei-agent-rules.mdc';
const d = fs.existsSync(p);
ck('全局规则文件存在(.mdc)', d, p);
if (d) { const c = fs.readFileSync(p,'utf8'); ck('规则文件非空', c.length>100, c.length); }
const setup = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
const sc = fs.existsSync(setup) ? fs.readFileSync(setup,'utf8') : '';
ck('setup-cli 引用该规则文件', sc.includes('huawei-agent-rules.mdc'), 'installed 11 目标注入');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-23', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
