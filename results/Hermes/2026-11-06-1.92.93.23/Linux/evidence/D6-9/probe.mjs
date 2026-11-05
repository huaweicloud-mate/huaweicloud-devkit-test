// D6-9 — 缓存清理三入口
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const market = await import(pathToFileURL(SRC + '/search-market.mjs').href);
const icon = await import(pathToFileURL(SRC + '/icon-library.mjs').href);
const proxy = await import(pathToFileURL(SRC + '/proxy/proxy-config.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const pagent = await import(pathToFileURL(SRC + '/proxy/proxy-agent.mjs').href);
ck('clearMarketCache 导出', typeof market.clearMarketCache==='function', '');
ck('clearIconCache 导出', typeof icon.clearIconCache==='function', '');
ck('clearProxyDispatcherCache 导出', typeof pagent.clearProxyDispatcherCache==='function', '');
let mok=true,iok=true,pok=true;
try { market.clearMarketCache(); market.clearMarketCache(); } catch(e){ mok=false; }
try { icon.clearIconCache(); icon.clearIconCache(); } catch(e){ iok=false; }
try { pagent.clearProxyDispatcherCache(); pagent.clearProxyDispatcherCache(); } catch(e){ pok=false; }
ck('三入口清理幂等不抛异常', mok && iok && pok, {mok,iok,pok});
const pass = checks.every(c=>c.ok);
const result = {caseId:'D6-9', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
