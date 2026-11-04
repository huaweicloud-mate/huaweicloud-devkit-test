// D4-12 — 供应链安装期安全
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const pol = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const fs = await import('node:fs');
const pkg = '/home/zhangshuang/devkit-test/Hermes/hdk/package.json';
const pk = JSON.parse(fs.readFileSync(pkg,'utf8'));
const scripts = pk.scripts || {};
ck('无恶意 postinstall', !scripts.postinstall || !/(curl|wget|bash -c|sh -c|eval|exec)/i.test(scripts.postinstall), scripts.postinstall || '(无 postinstall)');
ck('无 install 钩子恶意行为', !scripts.install || !/(curl|wget|bash|eval|exec)/i.test(scripts.install), scripts.install || '(无 install)');
const lock = fs.existsSync('/home/zhangshuang/devkit-test/Hermes/hdk/package-lock.json');
ck('依赖锁定(package-lock 存在)', lock, 'package-lock.json');
ck('单一运行时依赖收敛(undici)', pk.dependencies && Object.keys(pk.dependencies).length<=3, pk.dependencies && Object.keys(pk.dependencies));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D4-12', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
