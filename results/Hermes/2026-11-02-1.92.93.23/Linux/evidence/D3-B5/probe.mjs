// D3-B5 — detect_framework 识别 (修正探针: 提供完整 Next.js 工程 fixture)
// 真实探针：import hdk 源码，调用真实函数断言预期结果。
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const detect = await import(pathToFileURL(SRC + '/detect-framework.mjs').href);
function ts(){const d=new Date();const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
const checks=[];
function ck(name, ok, detail){ checks.push({name, ok:!!ok, detail:String(detail||'').slice(0,220)}); }
const p = '/tmp/.hdk-fw-'+process.pid;
mkdirSync(p, {recursive:true});
writeFileSync(p+'/next.config.js', 'module.exports = {};');
writeFileSync(p+'/package.json', JSON.stringify({dependencies:{next:'13.0.0'}}));
try {
  const r = detect.detectFramework(p);
  ck('识别返回 Next.js', !!r && r.framework==='Next.js', r && r.framework);
  ck('含 installCmd', !!r && !!r.installCmd, r && r.installCmd);
} catch(e){ ck('识别不抛异常', false, String(e).slice(0,150)); }
rmSync(p, {recursive:true, force:true});
const pass = checks.every(c=>c.ok);
const result = {caseId:'D3-B5', status: pass?'PASS':'FAIL', why: checks.map(c=>(c.ok?'P':'F')+':'+c.name).join(' '), executedAt: ts(), checks};
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log(result.caseId, result.status, checks.length, pass?'':'FAIL-DETAIL:'+JSON.stringify(checks.filter(c=>!c.ok)));