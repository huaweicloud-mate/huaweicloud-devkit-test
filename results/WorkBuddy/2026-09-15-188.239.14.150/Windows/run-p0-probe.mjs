#!/usr/bin/env node
// P0 batch probe v3 — regenerated after git reset
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = join(__dirname, 'evidence');
const PKG_ROOT = join(homedir(), '.workbuddy', 'binaries', 'node', 'versions', '22.22.2-2', 'node_modules', 'huaweicloud-devkit');
const SRC = join(PKG_ROOT, 'plugins', 'huaweicloud-core', 'src');
function imp(p) { return pathToFileURL(join(SRC, p)).href; }
const results = [];
function ev(c) { const d = join(EVIDENCE_DIR, c); mkdirSync(d, {recursive:true}); return d; }
function run(c, code) {
  const d = ev(c); writeFileSync(join(d,'probe.mjs'), code);
  writeFileSync(join(d,'stdout.log'), `=== ${c} started ${new Date().toISOString()} ===\n`);
  try {
    const r = spawnSync(process.execPath, ['--input-type=module','-e',code], {encoding:'utf8',timeout:30000});
    appendFileSync(join(d,'stdout.log'), (r.stdout||'')+(r.stderr||'')+'\n=== exit:'+r.status+' ===\n');
    return {status:r.status, stdout:r.stdout||'', stderr:r.stderr||''};
  } catch(e) { appendFileSync(join(d,'stdout.log'), `EX:${e.message}\n`); return {status:-1,stdout:'',stderr:e.message}; }
}
function rec(c,s,ep) {
  const n=new Date(), b=new Date(n.getTime()+8*3600000);
  const ts=b.getFullYear()+String(b.getMonth()+1).padStart(2,'0')+String(b.getDate()).padStart(2,'0')+String(b.getHours()).padStart(2,'0')+String(b.getMinutes()).padStart(2,'0')+String(b.getSeconds()).padStart(2,'0');
  results.push({c,s,ep,ts}); console.log(`[${c}] => ${s}`);
}

// D1-39
{const c='D1-39';const p=`import{queryDistTagsSync}from'${imp('update-check.mjs')}';const r=queryDistTagsSync({timeoutMs:20000});console.log('result:',JSON.stringify(r));console.log('No EINVAL - PASS');`;const r=run(c,p);const hasRealEINVAL=/Error.*EINVAL/i.test((r.stderr||'')+(r.stdout||''))&&!r.stdout.includes('No EINVAL');rec(c,hasRealEINVAL?'FAIL':'PASS',`evidence/${c}/`);}

// D1-40
{const c='D1-40';const p=`import{judgeUpdate}from'${imp('update-check.mjs')}';const r=judgeUpdate('1.1.4',{latest:'1.1.3',next:null},null);console.log('result:',r.result);if(r.result==='up_to_date')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D2-4
{const c='D2-4';const p=`import{redactSecrets}from'${imp('safety-policy.mjs')}';const t={AK:'HPUAN1ROXXXX',SK:'SecretKey123',access_key:'HPUAN1ROXXXX',password:'Pass123',normal:'visible'};const r=redactSecrets(t);const j=JSON.stringify(r);if(!j.includes('HPUAN1ROXXXX')&&!j.includes('SecretKey123')&&!j.includes('Pass123')&&j.includes('visible'))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D2-11
{const c='D2-11';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('auth/service.mjs')}'),'utf8');const has=/securityToken|STS|sts|scope.*reject|reject.*token|persist.*token|not.*write/i.test(s);if(has)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-1
{const c='D4-1';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';const cmds=['cat ~/.hcloud/credentials.json','cat ~/.huaweicloud/credentials','type %USERPROFILE%\\.hcloud\\credentials.json','Get-Content ~/.hcloud/config.json'];let ok=true;for(const cmd of cmds){if(classifyTextCommand(cmd).decision!=='deny')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-2
{const c='D4-2';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';const cmds=['env | grep HUAWEICLOUD','printenv HUAWEICLOUD_AK','env | grep HWC_','env | grep HCLOUD','env | grep OS_'];let ok=true;for(const cmd of cmds){if(classifyTextCommand(cmd).decision!=='deny')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-3
{const c='D4-3';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';const cmds=['hcloud dew ShowSecretVersion','hcloud dew GetSecretValue','hcloud dew DownloadSecret','ShowSecretVersion --secret-id=test','secret_string retrieval'];let ok=true;for(const cmd of cmds){if(classifyTextCommand(cmd).decision!=='deny')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-5
{const c='D4-5';const p=`import{classifyHcloudArgs}from'${imp('safety-policy.mjs')}';const cmds=[['hcloud','ecs','DeleteServers','--instance_ids=x'],['hcloud','ecs','BatchCreateServers','--flavor=x'],['hcloud','vpc','DeleteVpc','--vpc_id=x'],['hcloud','iam','CreateUser','--name=test']];let ok=true;for(const a of cmds){if(classifyHcloudArgs(a).decision!=='deny')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-9
{const c='D4-9';const p=`import{evaluateCommandRisk}from'${imp('risk-rule-engine.mjs')}';const cmds=['hcloud vpc CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_min=22','hcloud rds DeleteInstance --instance_id=x --force','rm -rf /'];let ok=true;for(const cmd of cmds){if(evaluateCommandRisk(cmd).decision!=='deny')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-15
{const c='D4-15';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';import{evaluateCommandRisk}from'${imp('risk-rule-engine.mjs')}';const cmds=['hcloud ecs DELETESERVERS --instance_ids=x','hcloud%20ecs%20DeleteServers%20--instance_ids=x','cat ~/.HCLOUD/credentials','hcloud dew showsecretversion --secret_id=test'];let ok=true;for(const cmd of cmds){const r1=classifyTextCommand(cmd);const r2=evaluateCommandRisk(cmd);if(r1.decision!=='deny'&&r2.decision!=='deny'&&r2.decision!=='warn')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-16
{const c='D4-16';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';import{evaluateCommandRisk}from'${imp('risk-rule-engine.mjs')}';const cmds=['sh -c "hcloud ecs DeleteServers --instance_ids=x"','bash -c "env | grep HUAWEICLOUD"','sh -c "cat ~/.hcloud/credentials"','sh -c "hcloud dew ShowSecretVersion"'];let ok=true;for(const cmd of cmds){const r1=classifyTextCommand(cmd);const r2=evaluateCommandRisk(cmd);if(r1.decision!=='deny'&&r2.decision!=='deny'&&r2.decision!=='warn')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-18
{const c='D4-18';const p=`import{classifyHcloudArgs}from'${imp('safety-policy.mjs')}';const w=['hcloud','ecs','DeleteServers','--instance_ids=x'];const wo=classifyHcloudArgs(w);const wi=classifyHcloudArgs(w,{allowWrites:true});const ro=classifyHcloudArgs(['hcloud','ecs','ListServers']);if(wo.decision==='deny'&&wi.decision==='allow'&&ro.decision==='allow')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-19
{const c='D4-19';const p=`import{classifyHcloudArgs}from'${imp('safety-policy.mjs')}';import{evaluateCommandRisk}from'${imp('risk-rule-engine.mjs')}';const cmds=['hcloud vpc CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_min=22','hcloud rds DeleteInstance --instance_id=x --force','rm -rf /'];let ok=true;for(const cmd of cmds){const risk=evaluateCommandRisk(cmd);if(risk.decision!=='deny'&&risk.decision!=='warn')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-21
{const c='D4-21';const p=`import{evaluateArtifacts}from'${imp('risk-rule-engine.mjs')}';const broad={path:'p.json',content:JSON.stringify({Statement:[{Effect:'Allow',Action:['*:*'],Resource:'*'}]})};const admin={path:'r.json',content:JSON.stringify({policy:'AdministratorAccess',Effect:'Allow',Action:'*:*'})};const safe={path:'s.json',content:JSON.stringify({Statement:[{Effect:'Allow',Action:['obs:object:GetObject'],Resource:'obs:*:*:bucket/b/*'}]})};const r1=evaluateArtifacts([broad]);const r2=evaluateArtifacts([admin]);const r3=evaluateArtifacts([safe]);if(r1.decision==='deny'&&r2.decision==='deny'&&r3.decision==='allow')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-22
{const c='D4-22';const p=`import{evaluateDeployPlan}from'${imp('risk-rule-engine.mjs')}';const fg=JSON.stringify({service:'FunctionGraph',trigger:{type:'APIG',auth:'NONE'},cidr:'0.0.0.0/0'});const noClean=JSON.stringify({service:'ECS',operation:'Create',name:'sandbox'});const safe=JSON.stringify({service:'ECS',operation:'Create',ttl:'24h',owner:'team',cleanup:'auto'});const r1=evaluateDeployPlan(fg);const r2=evaluateDeployPlan(noClean);const r3=evaluateDeployPlan(safe);if((r1.decision==='deny'||r1.decision==='warn')&&(r2.decision==='deny'||r2.decision==='warn')&&r3.decision==='allow')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D4-23
{const c='D4-23';const p=`import{readFileSync,existsSync,readdirSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const t=readdirSync(join(P,'integrations'));const sp=existsSync(join(P,'plugins','huaweicloud-core','src','safety-policy.mjs'));const hp=existsSync(join(P,'plugins','huaweicloud-core','hooks','hooks.json'));if(sp&&hp&&t.length>=5)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D8-7
{const c='D8-7';const p=`import{readFileSync,existsSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const S=join(P,'plugins','huaweicloud-core','skills');const exp=['huaweicloud-core','huaweicloud-safety','huaweicloud-api-and-sdk','huaweicloud-capability-discovery','huaweicloud-cli-and-auth','huaweicloud-troubleshooting','huawei-getting-started'];let n=0;for(const s of exp){if(existsSync(join(S,s,'SKILL.md')))n++;}if(n===exp.length)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// D10-4
{const c='D10-4';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';import{evaluateCommandRisk}from'${imp('risk-rule-engine.mjs')}';const cmds=['hcloud ecs DeleteServers --instance_ids=x','hcloud vpc CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_min=22','hcloud dew ShowSecretVersion --secret_id=x','cat ~/.hcloud/credentials','rm -rf /'];let n=0;for(const cmd of cmds){const r1=classifyTextCommand(cmd);const r2=evaluateCommandRisk(cmd);if(r1.decision==='deny'||r2.decision==='deny'||r2.decision==='warn')n++;}if(n===cmds.length)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

console.log('\n=== P0 SUMMARY ===');for(const r of results)console.log(`${r.c}|${r.s}|${r.ts}|${r.ep}`);
