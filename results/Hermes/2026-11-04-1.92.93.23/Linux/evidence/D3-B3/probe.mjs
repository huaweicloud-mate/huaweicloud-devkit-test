// D3-B3 — run_readonly 脱敏执行
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const r = await tools.callTool('huaweicloud_run_readonly_command', {args:['hcloud','ECS','ListServersDetails','--limit','1']});
ck('返回对象', r && typeof r==='object', typeof r);
const s = JSON.stringify(r);
ck('命令正确路由到 ECS 只读', /ECS|ListServers|hcloud/i.test(s), s.slice(0,150));
ck('输出不含明文 secret', !/secret[_-]?key\s*[:=]\s*[A-Za-z0-9]{10,}/i.test(s), '');
const pass = checks.every(c=>c.ok);
const result = {caseId:'D3-B3', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
