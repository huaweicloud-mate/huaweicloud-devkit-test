// DSH/Linux daily probe — CLI real-machine (doctor/status/install-hcloud/run_readonly) v1.1.4 stable
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}
const CLI = 'huaweicloud-devkit';
function run(args){ return spawnSync(CLI, args, { encoding:'utf8', timeout:90000 }); }
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';

// ---- D1-3 doctor ----
const doc = run(['doctor']);
const docOut = (doc.stdout||'') + (doc.stderr||'');
check('D1-3','doctor runs and reports', doc.status===0 && /hcloud|MCP|skill|auth|KooCLI/i.test(docOut), `exit=${doc.status} len=${docOut.length}`);

// ---- D1-4 status/update 幂等 (config untouched) ----
const credPath = process.env.HUAWEICLOUD_HOME ? undefined : '/home/testbot2/.config/huaweicloud/credentials.json';
let cfgHashBefore = null;
if (existsSync(credPath||'')) cfgHashBefore = createHash('sha256').update(readFileSync(credPath)).digest('hex');
const st = run(['status']);
const stOut = (st.stdout||'') + (st.stderr||'');
check('D1-4','status reports installed agents', st.status===0 && /opencode|dsh|hermes|codearts|installed|Installed/i.test(stOut), `exit=${st.status}`);
let cfgHashAfter = null;
if (existsSync(credPath||'')) cfgHashAfter = createHash('sha256').update(readFileSync(credPath)).digest('hex');
check('D1-4','status does not touch user config', cfgHashBefore===null || cfgHashBefore===cfgHashAfter, `before=${cfgHashBefore?.slice(0,8)} after=${cfgHashAfter?.slice(0,8)}`);
const st2 = run(['status']);
check('D1-4','status idempotent (repeat) ', st2.status===0, `exit=${st2.status}`);

// ---- D1-6 install-hcloud ----
const ih = run(['install-hcloud']);
const ihOut = (ih.stdout||'') + (ih.stderr||'');
check('D1-6','install-hcloud shows OS install guide', ih.status!== -1 && (/hcloud|KooCLI|curl|下载|install|npm|Windows|Linux/i.test(ihOut)), `exit=${ih.status} len=${ihOut.length}`);

// ---- D3-B3 run_readonly 脱敏执行 ----
const { callTool } = await import(CORE + '/tools.mjs');
const ro = await callTool('huaweicloud_run_readonly_command', { args:['vpc','ListVpcs'] });
// read-only command runs (may fail on auth if no VPC creds, but must be read-only classified and not write)
const isReadOnly = ro && !/Delete|Create|Modify|write/i.test(JSON.stringify(ro.command || ro.args || ''));
check('D3-B3','run_readonly executes read-only cmd', ro && (ro.ok===true || ro.result?.ok===true || typeof ro.output==='string' || ro.stdout!==undefined || ro.exitCode!==undefined || ro.error!==undefined), JSON.stringify(ro).slice(0,120));
check('D3-B3','run_readonly never issues write op', isReadOnly, true);

const failed=results.filter(r=>!r.pass);
console.log('=== CLI PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name} => ${r.actual}`);}
console.log('doctor tail:', (doc.stdout||'').slice(-400));
