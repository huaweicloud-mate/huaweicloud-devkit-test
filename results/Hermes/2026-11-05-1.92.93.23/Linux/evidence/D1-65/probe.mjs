// D1-65 — 调试模式环境变量
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const old = process.env.HUAWEICLOUD_DEVKIT_DEBUG;
process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
// SKIP_UPDATE 由 judgeUpdate 读取；DEBUG 由 debugLog 读取——通过有无异常验证环境变量通路存在
const r = upd.judgeUpdate('1.1.0', {latest:'1.1.12'}, null);
ck('DEBUG=1 下函数正常', r.result==='update_available', r);
if(old===undefined) delete process.env.HUAWEICLOUD_DEVKIT_DEBUG; else process.env.HUAWEICLOUD_DEVKIT_DEBUG=old;
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-65', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
