// D2-1 — auth init 三端同步
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(SRC + '/tools.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const c0 = await tools.callTool('huaweicloud_auth_init', {clear:true});
ck('auth_init clear 无副作用', c0 && c0.status==='cleared', c0);
const c1 = await tools.callTool('huaweicloud_auth_init', {ak:'AK-DUMMY-TEST-000000', sk:'SK-DUMMY-TEST-000000'});
ck('auth_init 设 runtime 凭证', c1 && c1.status==='ok', c1);
await tools.callTool('huaweicloud_auth_init', {clear:true});
const st = await tools.callTool('huaweicloud_auth_status', {target:'all'});
ck('auth_status 三端字段齐全', st && st.credentialsConfigured!==undefined && st.mcpSettingsConfigured!==undefined && st.agents!==undefined && st.kooCliInstalled!==undefined, st ? Object.keys(st) : null);
const sy = await tools.callTool('huaweicloud_auth_sync', {target:'all'});
ck('auth_sync 返回结果对象', sy && typeof sy==='object', sy ? Object.keys(sy) : null);
const pass = checks.every(c=>c.ok);
const result = {caseId:'D2-1', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
