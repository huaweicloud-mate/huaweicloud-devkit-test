// DSH/Linux daily probe — supplementary auth + functional tools (hermetic)
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const results=[];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}

const tmphome=mkdtempSync(join(tmpdir(),'hdk-dsh-auth-'));
process.env.HUAWEICLOUD_HOME=tmphome;
const { writeGlobalCredentials, readGlobalCredentials, resolveCredentials,
        setRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime,
        globalCredentialsPath } = await import(CORE + '/auth/credentials.mjs');

// D2-5 missing creds
{
  delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HW_SECURITY_TOKEN;
  let err=null; try{ resolveCredentials({}); }catch(e){ err=e; }
  check('D2-5','missing credentials throws', !!err, err?err.message:'no throw');
  check('D2-5','error code HDKIT_CRED_MISSING', err?.code==='HDKIT_CRED_MISSING', err?.code);
  check('D2-5','error points to auth init / env', /auth init|HW_ACCESS_KEY\/HW_SECRET_KEY/i.test(err?.message||''), err?.message);
}

// D2-12 R10 runtime not persisted
{
  setRuntimeCredentials('AKRT','SKRT','STRT','cn-north-4');
  const persisted = readGlobalCredentials();
  const rf = resolveCredentialsWithRuntime();
  check('D2-12','runtime creds in-memory', hasRuntimeCredentials()&&rf.ak==='AKRT', rf.ak);
  check('D2-12','runtime creds NOT persisted', persisted===null, persisted);
  check('D2-12','global creds file not created', !existsSync(globalCredentialsPath()), globalCredentialsPath());
}

// D2-13 R9 configuredBySession wins over env
{
  writeGlobalCredentials({ak:'STOREDAK',sk:'STOREDSK',region:'cn-north-4',configuredBySession:true});
  process.env.HW_ACCESS_KEY='ENVAK'; process.env.HW_SECRET_KEY='ENVSK'; delete process.env.HW_SECURITY_TOKEN;
  const r = resolveCredentials({});
  check('D2-13','configuredBySession ak wins', r.ak==='STOREDAK', r.ak);
  check('D2-13','configuredBySession sk wins', r.sk==='STOREDSK', r.sk);
}

// D2-16 import wipe contract (source-level)
{
  const toolsSrc = readFileSync(CORE.replace('file://','') + '/tools.mjs','utf8');
  const hasWipe = /creds-import\.json/.test(toolsSrc) && /rmSync/.test(toolsSrc) && /force:\s*true/.test(toolsSrc);
  check('D2-16','import wipes creds-import.json', hasWipe, hasWipe?'tools.mjs read->rmSync force':'not found');
}

// D5-1 / D3-A1 / D8-7 skills manifest
const { listSkillDirs, findSkillsRoot, callTool } = await import(CORE + '/tools.mjs');
const { detectFramework } = await import(CORE + '/detect-framework.mjs');
{
  const skillRoot = join(process.env.HOME,'nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/skills');
  const found = listSkillDirs(skillRoot);
  const uniq=[...new Set(found)];
  check('D5-1','plugin skill dirs non-empty', uniq.length>0, `total=${uniq.length}`);
  check('D5-1','>= 20 skills discovered', uniq.length>=20, `total=${uniq.length}`);
  const meta=['huaweicloud-core','huaweicloud-cli-and-auth','huaweicloud-safety','huawei-getting-started'];
  const metaOk = meta.every(m=>uniq.some(p=>p.endsWith('/'+m)||p.endsWith(m)));
  check('D3-A1','meta skills present', metaOk, meta.filter(m=>!uniq.some(p=>p.endsWith(m))).join(',')||'all');
  check('D8-7','>=4 meta skills machine-enumerable', metaOk, `${uniq.length} skills`);
}

// D3-B1 list_operations
{
  let r=null,err=null; try{ r=await callTool('huaweicloud_list_operations',{service:'ECS',timeoutMs:20000}); }catch(e){err=e;}
  check('D3-B1','list_operations structured contract', !err&&r&&r.service==='ECS'&&typeof r.command==='string'&&typeof r.selectionRule==='string', err?`err=${err.message}`:{service:r?.service,command:r?.command});
  const hc=r&&r.result;
  check('D3-B1','list_operations runs hcloud help ok', !err&&hc&&hc.ok===true, hc?{ok:hc.ok,stdout:String(hc.stdout||'').slice(0,80)}:'n/a');
}

// D3-B5 detect_framework
{
  const proj=mkdtempSync(join(tmpdir(),'hdk-dsh-fw-'));
  mkdirSync(join(proj,'public'),{recursive:true});
  writeFileSync(join(proj,'package.json'),JSON.stringify({name:'x',dependencies:{'react-scripts':'5',react:'18'}}));
  writeFileSync(join(proj,'public','index.html'),'<html></html>');
  let out=null,err=null; try{out=detectFramework(proj);}catch(e){err=e;}
  check('D3-B5','detectFramework no throw', !err&&out&&typeof out==='object', `type=${typeof out} err=${err?.message||''}`);
  const fw=out&&(out.framework||out.type||'');
  check('D3-B5','CRA fixture detected React family', !err&&/react|create-react|CRA|js/i.test(String(fw)), JSON.stringify(out).slice(0,160));
  rmSync(proj,{recursive:true,force:true});
}

// D1-41 check_update contract
{
  let r=null,err=null; try{ r=await callTool('huaweicloud_check_update',{timeoutMs:20000}); }catch(e){err=e;}
  const ok=!err&&r&&typeof r==='object';
  check('D1-41','check_update structured object', ok, `err=${err?.message||''}`);
  check('D1-41','has result + updateAvailable', ok&&'result' in r&&'updateAvailable' in r, ok?{result:r.result,updateAvailable:r.updateAvailable}:'n/a');
}

const failed=results.filter(r=>!r.pass);
console.log('=== SUPPLEMENT PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${String(r.actual).slice(0,220)}`);
if(failed.length){console.log('\nFAILED:');for(const r of failed)console.log(`  ${r.id} ${r.name}`);process.exit(1);}
console.log('\nALL SUPPLEMENT ASSERTIONS PASSED');
rmSync(tmphome,{recursive:true,force:true});
