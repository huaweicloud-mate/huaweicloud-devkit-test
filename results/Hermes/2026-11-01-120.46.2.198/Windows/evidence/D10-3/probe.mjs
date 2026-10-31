import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const CSV = 'C:/Users/Administrator/devkit-test/testbot5-win-hermes/huaweicloud-devkit-test/eval/prompts/eval-set-v1.csv';
const EXPECT = { 'EXP-E01':['ECS'],'EXP-E02':['ECS'],'EXP-E03':['OBS'],'EXP-E04':['EIP'],'EXP-E05':['RDS'],'EXP-E06':['DCS'],'EXP-E07':['CBR'],'EXP-E08':null,'EXP-E09':['CCE'],'EXP-E10':['FunctionGraph'],'EXP-E11':['BSS'],'EXP-E12':['CES'],'EXP-E13':['ELB'],'EXP-E14':['IAM'],'EXP-E15':['Incentive Voucher'] };
const csv = readFileSync(CSV, 'utf-8').replace(/^\uFEFF/,'');
const rows = csv.trim().split(/\r?\n/).slice(1).map(l => { const v = l.split(','); return { id:v[0], prompt:v[1] }; });
const child = spawn(process.execPath, [SERVER], { stdio:['pipe','pipe','pipe'], env:{ ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE:'local' } });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(o){ const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r)); }
child.stdout.on('data',(d)=>{ buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id!=null&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });
await send({ jsonrpc:'2.0', id:_id++, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name:'probe', version:'1' } } });
let hit=0, miss=0;
for (const r of rows) { const resp = await send({ jsonrpc:'2.0', id:_id++, method:'tools/call', params:{ name:'huaweicloud_service_catalog', arguments:{ intent:r.prompt } } }); const text=resp?.result?.content?.[0]?.text||''; let rr={}; try{rr=text?JSON.parse(text):{};}catch{} const svcs=rr.recommendedServices||[]; const exp=EXPECT[r.id]; if(exp===null) continue; exp.some(s=>svcs.includes(s)) ? hit++ : miss++; }
const acc = (hit/(hit+miss))*100;
const status = acc >= 90 ? 'PASS':'FAIL';
const rec = { status, why: '路由准确率=' + acc.toFixed(1) + '% (HIT=' + hit + ' MISS=' + miss + ')，阈值≥90%', executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D10-3' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
child.kill(); process.exit(0);
