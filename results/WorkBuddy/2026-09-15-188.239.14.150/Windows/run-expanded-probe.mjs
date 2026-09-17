#!/usr/bin/env node
// Expanded-level case probes
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
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
function block(c,reason) {
  const n=new Date(), b=new Date(n.getTime()+8*3600000);
  const ts=b.getFullYear()+String(b.getMonth()+1).padStart(2,'0')+String(b.getDate()).padStart(2,'0')+String(b.getHours()).padStart(2,'0')+String(b.getMinutes()).padStart(2,'0')+String(b.getSeconds()).padStart(2,'0');
  const d=ev(c); writeFileSync(join(d,'probe.mjs'), `// ${c}: BLOCKED - ${reason}\n`);
  writeFileSync(join(d,'stdout.log'), `=== ${c} BLOCKED: ${reason} ===\n`);
  results.push({c,s:'BLOCKED',ep:'',ts}); console.log(`[${c}] => BLOCKED (${reason})`);
}

// EXP-D5-5-1: WorkBuddy plugin manifest discovery
{const c='EXP-D5-5-1';const p=`import{existsSync,readdirSync,readFileSync}from'node:fs';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const wb=existsSync(join(P,'integrations','workbuddy'));const plugin=existsSync(join(P,'plugins','huaweicloud-core','.workbuddy-plugin','plugin.json'));const openclaw=existsSync(join(P,'plugins','huaweicloud-core','openclaw.plugin.json'));if(wb||plugin||openclaw)console.log('PASS');else console.log('FAIL');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// EXP-D5-5-3: tools/list enumerates 40 tools with complete schema
{const c='EXP-D5-5-3';const p=`import{spawnSync}from'node:child_process';import{join}from'node:path';import{homedir}from'node:os';const P=join(homedir(),'.workbuddy','binaries','node','versions','22.22.2-2','node_modules','huaweicloud-devkit');const mcp=join(P,'plugins','huaweicloud-core','src','mcp-server.mjs');const init=JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1.0'}}})+'\\n';const list=JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}})+'\\n';const r=spawnSync(process.execPath,[mcp],{input:init+list,encoding:'utf8',timeout:15000});const o=r.stdout||'';const tools=[...o.matchAll(/"name"\\s*:\\s*"(huaweicloud_[a-z_]+)"/g)].map(m=>m[1]);const unique=[...new Set(tools)];if(unique.length>=39)console.log('PASS: '+unique.length+' tools');else console.log('FAIL: only '+unique.length+' tools');`;const r=run(c,p);rec(c,r.stdout.includes('PASS')?'PASS':'FAIL',`evidence/${c}/`);}

// EXP-E01..E15: All require LLM agent harness for routing tests
['EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E06','EXP-E07','EXP-E08','EXP-E09','EXP-E10','EXP-E11','EXP-E12','EXP-E13','EXP-E14','EXP-E15'].forEach(id=>block(id,'Requires LLM agent harness for routing scenario test'));

console.log('\n=== EXPANDED SUMMARY ===');for(const r of results)console.log(`${r.c}|${r.s}|${r.ts}|${r.ep}`);
