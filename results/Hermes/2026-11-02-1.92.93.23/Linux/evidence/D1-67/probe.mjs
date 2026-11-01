// D1-67 — Agent toolkit 模式与 DSH 跳过安装环境变量
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const upd = await import(pathToFileURL(SRC + '/update-check.mjs').href);
const reg = await import(pathToFileURL(SRC + '/auth/agent-registration.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
ck('SUPPORTED_AGENT_TARGETS 含 hermes', reg.SUPPORTED_AGENT_TARGETS.includes('hermes'), reg.SUPPORTED_AGENT_TARGETS);
ck('含 dsh', reg.SUPPORTED_AGENT_TARGETS.includes('dsh'), '');
ck('含 10 个目标', reg.SUPPORTED_AGENT_TARGETS.length >= 10, reg.SUPPORTED_AGENT_TARGETS.length);
const old=process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE; process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE='1';
const r=upd.judgeUpdate('1.1.0',{latest:'9.9.9'},null);
ck('SKIP_UPDATE 生效', r.result==='up_to_date', r);
if(old===undefined) delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE; else process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE=old;
const pass = checks.every(c=>c.ok);
const result = {caseId:'D1-67', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));
