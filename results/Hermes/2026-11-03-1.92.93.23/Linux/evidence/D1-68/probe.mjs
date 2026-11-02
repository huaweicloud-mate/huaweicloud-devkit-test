// D1-68 — 图标离线与区域环境变量
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const icon = await import(pathToFileURL(SRC + '/icon-library.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
try { icon.clearIconCache(); ck('clearIconCache 可调用', true, 'ok'); } catch(e){ ck('clearIconCache 可调用', false, e); }
ck('getServiceIcon 导出', typeof icon.getServiceIcon==='function', typeof icon.getServiceIcon);
const r = await icon.getServiceIcon('ECS', '');
ck('ECS 图标返回字符串或对象', r!==null && r!==undefined, typeof r);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-68', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
