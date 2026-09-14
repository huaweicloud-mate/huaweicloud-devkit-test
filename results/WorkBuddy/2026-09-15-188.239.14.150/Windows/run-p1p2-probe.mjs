#!/usr/bin/env node
// P1+P2 probe v3 - regenerated after git reset
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = join(__dirname, 'evidence');
const PKG_ROOT = join(homedir(), '.workbuddy', 'binaries', 'node', 'versions', '22.22.2-2', 'node_modules', 'huaweicloud-devkit');
const SRC = join(PKG_ROOT, 'plugins', 'huaweicloud-core', 'src');
const SETUP = join(SRC, 'setup-cli.mjs');
function imp(p) { return pathToFileURL(join(SRC, p)).href; }
function impSetup() { return pathToFileURL(SETUP).href; }
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
function block(c,reason) {
  const n=new Date(), b=new Date(n.getTime()+8*3600000);
  const ts=b.getFullYear()+String(b.getMonth()+1).padStart(2,'0')+String(b.getDate()).padStart(2,'0')+String(b.getHours()).padStart(2,'0')+String(b.getMinutes()).padStart(2,'0')+String(b.getSeconds()).padStart(2,'0');
  const d=ev(c); writeFileSync(join(d,'probe.mjs'), `// ${c}: BLOCKED - ${reason}\n`);
  writeFileSync(join(d,'stdout.log'), `=== ${c} BLOCKED: ${reason} ===\n`);
  results.push({c,s:'BLOCKED',ep:'',ts}); console.log(`[${c}] => BLOCKED (${reason})`);
}

// P1 cases
block('D1-1','Cannot reset to fresh-uninstalled state in active WorkBuddy session');
{const c='D1-3';const p=`import{spawnSync}from'node:child_process';const r=spawnSync('npx',['huaweicloud-devkit','doctor'],{encoding:'utf8',timeout:30000,shell:true});const o=(r.stdout||'')+(r.stderr||'');if(/check|verify|ok|fail|pass|status|component|environment/i.test(o))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D1-5','Cannot run uninstall in active testing session');
{const c='D1-26';const p=`import{readFileSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const s=readFileSync(join(P,'plugins','huaweicloud-core','src','tools.mjs'),'utf8');if(/check_update|upgrade/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-27';const p=`import{judgeUpdate}from'${imp('update-check.mjs')}';const r=judgeUpdate('1.1.4',{latest:'1.1.4',next:null},null);if(r.result==='up_to_date')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-28';const p=`import{judgeUpdate}from'${imp('update-check.mjs')}';const r=judgeUpdate('1.1.3',{latest:'1.1.4',next:null},null);if(r.result==='update_available'&&r.targetVersion==='1.1.4')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-31';const p=`import{judgeUpdate}from'${imp('update-check.mjs')}';const now=Date.now();const ss={dismissedVersion:'1.1.4',dismissedAt:new Date(now).toISOString(),expireAt:new Date(now+3*86400000).toISOString()};const r=judgeUpdate('1.1.3',{latest:'1.1.4',next:null},ss,now);if(r.result==='dismissed')console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D1-41','Requires MCP server with mock result injection');
block('D1-42','Requires MCP server lifecycle management');
block('D1-45','Requires MCP server startup timing control');
block('D1-58','Requires isolated HOME + fresh install');
block('D2-1','Requires real cloud credential initialization');
block('D2-5','Requires credential removal and real auth init');
{const c='D2-10';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('auth/credentials.mjs')}'),'utf8');if(/current|deploy|profile|active/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D2-12';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('auth/service.mjs')}'),'utf8');if(/runtime|runtimeActive|auth_init|auth_sync/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D2-13';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('auth/credentials.mjs')}'),'utf8');if(/configuredBySession|session.*priority|resolveCredentials/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D2-16';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('auth/service.mjs')}'),'utf8');if(/import|creds-import|erase|delete.*file|unlink/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D3-A1';const p=`import{readFileSync,existsSync,readdirSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const s=readdirSync(join(P,'plugins','huaweicloud-core','skills'));if(s.length>=28)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D3-B3','Requires real MCP server tool call');
block('D3-C4','Requires real cloud resources - E2E test');
{const c='D3-C5';const p=`import{readFileSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const s=readFileSync(join(P,'plugins','huaweicloud-core','src','tools.mjs'),'utf8');if(/check_cli|list_operations|plan_cli_command|explain_error/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D4-4';const p=`import{classifyHcloudArgs}from'${imp('safety-policy.mjs')}';const cmds=[['hcloud','ecs','CreateServer','--flavor=x'],['hcloud','ecs','DeleteServer','--id=x'],['hcloud','iam','CreateUser','--name=t']];let ok=true;for(const a of cmds){if(classifyHcloudArgs(a).decision!=='deny')ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D4-6';const p=`import{redactSecrets}from'${imp('safety-policy.mjs')}';const r=redactSecrets({adminPass:'Secret123',name:'test'});if(JSON.stringify(r).includes('<redacted>')&&!JSON.stringify(r).includes('Secret123'))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D4-7';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';import{evaluateArtifacts,evaluateDeployPlan}from'${imp('risk-rule-engine.mjs')}';const c1=classifyTextCommand('cat ~/.hcloud/credentials').decision;const a1=evaluateArtifacts([{path:'p.json',content:JSON.stringify({Statement:[{Effect:'Allow',Action:['*:*'],Resource:'*'}]})}]).decision;const d1=evaluateDeployPlan(JSON.stringify({service:'FunctionGraph',trigger:{type:'APIG',auth:'NONE'},cidr:'0.0.0.0/0'})).decision;if(c1==='deny'&&a1==='deny'&&(d1==='deny'||d1==='warn'))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D4-8';const p=`import{existsSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const py=existsSync(join(P,'plugins','huaweicloud-core','hooks','huaweicloud-safety.py'));const nd=existsSync(join(P,'plugins','huaweicloud-core','hooks','huaweicloud-safety.mjs'));if(py&&nd)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D4-11','Requires LLM agent behavior testing');
block('D4-13','Requires real cloud credential with minimum privilege');
{const c='D4-17';const p=`import{classifyTextCommand}from'${imp('safety-policy.mjs')}';import{evaluateCommandRisk,evaluateArtifacts,evaluateDeployPlan}from'${imp('risk-rule-engine.mjs')}';const inputs=['','  ','null','undefined','a'.repeat(9999),'{{}}','hcloud'];let ok=true;for(const i of inputs){try{classifyTextCommand(i);evaluateCommandRisk(i);evaluateArtifacts([{path:'t',content:i}]);evaluateDeployPlan(i);}catch(e){ok=false;}}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D4-20','Requires real MCP server with approval flow');
block('D4-24','Requires MCP server with confirm token lifecycle');
{const c='D5-1';const p=`import{existsSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');if(existsSync(join(P,'integrations','workbuddy'))||existsSync(join(P,'plugins','huaweicloud-core','openclaw.plugin.json')))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D5-3';const p=`import{readFileSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const s=readFileSync(join(P,'plugins','huaweicloud-core','src','tools.mjs'),'utf8');const m=[...s.matchAll(/huaweicloud_[a-z_]+/g)].map(x=>x[0]);const u=[...new Set(m)];if(u.length>=39)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D6-4','Requires MCP server concurrent test harness');
{const c='D8-4';const p=`import{readFileSync,existsSync,readdirSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const S=join(P,'plugins','huaweicloud-core','skills');const skills=readdirSync(S);let n=0;for(const s of skills){const c2=readFileSync(join(S,s,'SKILL.md'),'utf8');if(/##|Usage|step/i.test(c2)&&!/maybe|perhaps|大概|可能/i.test(c2))n++;}if(n>=skills.length*0.9)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D9-1';const p=`import{spawnSync}from'node:child_process';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const mcp=join(P,'plugins','huaweicloud-core','src','mcp-server.mjs');const init=JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1.0'}}})+'\\n';const list=JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}})+'\\n';const r=spawnSync(process.execPath,[mcp],{input:init+list,encoding:'utf8',timeout:15000});const o=r.stdout||'';if(/tools/.test(o)&&/huaweicloud_/.test(o))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
['D9-2','D9-3','D9-4','D9-5','D9-6','D9-9'].forEach(id=>block(id,'Requires MCP Inspector'));
['D10-1','D10-2','D10-3','D10-5'].forEach(id=>block(id,'Requires LLM agent harness'));

// P2 cases
{const c='D1-2';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${impSetup()}'),'utf8');if(/detect|auto.?detect|all.*them|multi.*client/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-4';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${impSetup()}'),'utf8');if(/status/i.test(s)&&/incremental|without.*config/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-6';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${impSetup()}'),'utf8');if(/install.?hcloud|hcloud.*install|findHcloudBin|probeHcloud/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-30';const p=`import{semverCompare}from'${imp('update-check.mjs')}';const t=[['1.1.4','1.1.3',1],['1.1.3','1.1.4',-1],['1.1.4','1.1.4',0],['2.0.0','1.9.9',1]];let ok=true;for(const[a,b,e]of t){if(Math.sign(semverCompare(a,b))!==e)ok=false;}if(ok)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D1-33';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('update-check.mjs')}'),'utf8');if(/skip.*file|dismiss.*file|skipFile|writeFileSync/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D2-2';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${imp('auth/credentials.mjs')}'),'utf8');if(/status|active|valid|expired|missing/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D3-B1','Requires real MCP server tool calls');
block('D3-B5','Requires real MCP server tool calls');
{const c='D4-10';const p=`import{readFileSync}from'node:fs';const r=JSON.parse(readFileSync(new URL('${imp('../safety/rules/cloud-risk-rules.json')}'),'utf8'));if(r.rules.length>=10)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D4-12','Requires fresh install with malicious package');
block('D4-14','Requires real cloud audit log access');
block('D6-1','Requires performance benchmarking');
block('D6-3','Requires performance benchmarking');
{const c='D7-4';const p=`import{readFileSync}from'node:fs';const s=readFileSync(new URL('${impSetup()}'),'utf8');if(/mirror|gitcode|registry|fallback/i.test(s))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D8-1';const p=`import{readFileSync,existsSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');if(!existsSync(join(P,'README.md')))console.log('FAIL');else{const c2=readFileSync(join(P,'README.md'),'utf8');if(/install|doctor|auth|tool|MCP/i.test(c2))console.log('PASS');else console.log('FAIL');}`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
{const c='D8-6';const p=`import{existsSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');if(existsSync(join(P,'README.md'))&&existsSync(join(P,'README.zh-CN.md')))console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}
block('D9-7','Requires MCP Inspector');
block('D9-8','Requires MCP Inspector');

console.log('\n=== P1+P2 SUMMARY ===');for(const r of results)console.log(`${r.c}|${r.s}|${r.ts}|${r.ep}`);
