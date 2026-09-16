// DSH/Linux daily probe — functionality (skills/operations/detect/smoke) v1.1.4 stable
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');
const { detectFramework } = await import(CORE + '/detect-framework.mjs');
const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}

// ---- D3-A1 skill 检索完整性 ----
const SKILLS = join(process.env.DSH_HOME || join(process.env.HOME,'.dsh'), 'skills');
const skillDirNames = readdirSync(SKILLS, {withFileTypes:true}).filter(d=>d.isDirectory()&&existsSync(join(SKILLS,d.name,'SKILL.md'))).map(d=>d.name);
let okCount=0, failNames=[];
for (const sn of skillDirNames) {
  try { const r = await callTool('huaweicloud_retrieve_skill', {name: sn}); if (r && r.ok && r.content && r.content.length>50) okCount++; else failNames.push(sn); }
  catch(e){ failNames.push(sn); }
}
check('D3-A1', `retrieve_skill all ${skillDirNames.length} skills ok`, okCount===skillDirNames.length, `${okCount}/${skillDirNames.length}${failNames.length?' fail='+failNames.join(','):''}`);

// ---- D8-7 7 meta/通用技能 ----
const meta = ['huaweicloud-core','huaweicloud-capability-discovery','huaweicloud-cli-and-auth','huaweicloud-api-and-sdk','huaweicloud-safety','huaweicloud-troubleshooting','huawei-getting-started'];
let metaOk=0, metaNames=[];
for (const sn of meta) { const r = await callTool('huaweicloud_retrieve_skill',{name:sn}); if (r && r.ok && r.content && r.content.length>100) metaOk++; else metaNames.push(sn); }
check('D8-7','7 meta skills load with content', metaOk===7, `${metaOk}/7${metaNames.length?' fail='+metaNames.join(','):''}`);

// ---- D3-B1 list_operations ----
const loEcs = await callTool('huaweicloud_list_operations', {service:'ECS'});
check('D3-B1','list_operations ECS ok+ops', loEcs && loEcs.result?.ok===true && /CreateServers|ListServers/.test(loEcs.result.stdout||''), loEcs?.result?.ok);
const loVpc = await callTool('huaweicloud_list_operations', {service:'VPC'});
check('D3-B1','list_operations VPC ok', loVpc && loVpc.result?.ok===true, loVpc?.result?.ok);
const loObs = await callTool('huaweicloud_list_operations', {service:'OBS'});
check('D3-B1','list_operations OBS ok', loObs && loObs.result?.ok===true && /obs/.test(loObs.command||''), loObs?.result?.ok);

// ---- D3-B5 detect_framework ----
const base = mkdtempSync(join(tmpdir(), 'hdk-fw-'));
function makeFw(key, files) {
  const dir = join(base, key);
  for (const [rel, content] of Object.entries(files)) {
    const p = join(dir, rel); mkdirSync(join(p,'..'), {recursive:true});
    if (content !== null) writeFileSync(p, content);
  }
  return dir;
}
const angularJson = JSON.stringify({ projects: { a: { architect: { build: { options: { outputPath: "dist/a" } } } } } });
const taroPkg = JSON.stringify({ dependencies: { "@tarojs/taro": "3.0.0" } });
const uniappPkg = JSON.stringify({ dependencies: { "uni-app": "3.0.0" } });
const vuecliPkg = JSON.stringify({ dependencies: { "@vue/cli-service": "5.0.0" } });
const cases = [
  ['nextjs','Next.js', {'next.config.js':''}],
  ['vite','Vite (React/Vue/Svelte)', {'vite.config.js':''}],
  ['nuxt','Nuxt', {'nuxt.config.ts':''}],
  ['angular','Angular', {'angular.json':angularJson}],
  ['hexo','Hexo', {'_config.yml':''}],
  ['hugo','Hugo', {'config.toml':''}],
  ['docusaurus','Docusaurus', {'docusaurus.config.js':''}],
  ['vueCli','Vue CLI', {'package.json':vuecliPkg}],
  ['taro','Taro', {'package.json':taroPkg}],
  ['uniapp','uni-app', {'package.json':uniappPkg}],
  ['vitepress','VitePress', {'.vitepress/config.js':''}],
  ['static','Static Site', {'index.html':'<html></html>'}],
  ['monorepo','Monorepo', {'turbo.json':'{}', 'apps/web/package.json':'{"name":"web","dependencies":{"next":"14"}}', 'apps/web/next.config.js':''}],
];
let fwOk=0, fwNames=[];
for (const [key, expect, files] of cases) {
  const dir = makeFw(key, files);
  let r; try { r = detectFramework(dir); } catch(e){ r = {framework:'ERR:'+e.message}; }
  const fw = r?.framework;
  if (key==='monorepo') { if (fw==='Monorepo') fwOk++; else fwNames.push(key+'->'+fw); }
  else { if (fw===expect) fwOk++; else fwNames.push(key+'->'+fw); }
}
check('D3-B5', `detect_framework ${cases.length} frameworks accurate`, fwOk>=11, `${fwOk}/${cases.length}${fwNames.length?' fail='+fwNames.join(','):''}`);
rmSync(base, {recursive:true, force:true});

// ---- D3-C5 四工具冒烟 ----
const cc = await callTool('huaweicloud_check_cli', {});
check('D3-C5','check_cli smoke', cc.installed===true, cc.status);
const plan = await callTool('huaweicloud_plan_cli_command', {args:['ECS','ListServersDetails']});
check('D3-C5','plan_cli_command read-only smoke', plan && plan.classification?.risk==='read_only' && plan.safeToRun===true, plan.classification?.risk+'/'+plan.safeToRun);
const ee = await callTool('huaweicloud_explain_error', {errorCode:'APIGW.0301', message:'invalid AK/SK'});
check('D3-C5','explain_error smoke', ee && Array.isArray(ee.suggestions) && ee.suggestions.length>0, JSON.stringify(ee).slice(0,80));

const failed=results.filter(r=>!r.pass);
console.log('=== FUNC PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name} => ${r.actual}`);}
