// D1-70 — 代理配置与 WebSocket 代理
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const proxy = await import(pathToFileURL(SRC + '/proxy/proxy-config.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('readProxyConfig 导出', typeof proxy.readProxyConfig==='function', '');
const cfg = proxy.readProxyConfig();
ck('返回对象或空(未配置)', cfg===null || cfg===undefined || typeof cfg==='object', cfg);
ck('shouldBypassProxy 导出', typeof proxy.shouldBypassProxy==='function', '');
ck('getProxySettings 导出', typeof proxy.getProxySettings==='function', '');
const NO_PROXY='localhost,127.0.0.1';
ck('no_proxy 绕过判定', proxy.shouldBypassProxy('localhost', NO_PROXY.split(','))===true, proxy.shouldBypassProxy('localhost',NO_PROXY.split(',')));
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-70', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
