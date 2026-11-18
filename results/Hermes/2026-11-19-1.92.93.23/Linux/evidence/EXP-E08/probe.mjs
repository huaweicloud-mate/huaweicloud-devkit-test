import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const SERVER = '/tmp/hdkbridge_20261119/mcp-server.mjs';
const HERE = new URL('.', import.meta.url).pathname;
function finish(status, why) { const ts = new Date(Date.now()+8*3600*1000).toISOString().replace(/[-:TZ]/g,'').slice(0,14); writeFileSync(HERE+'stdout.log', JSON.stringify({caseId:'EXP-E08',status,why,executedAt:ts}, null, 1)); }
const child = spawn(process.execPath, [SERVER], { stdio:['pipe','pipe','pipe'], env:{...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE:'local'} });
let buf = Buffer.alloc(0); let _id = 1; const pending = new Map();
child.stderr.on('data', (d) => process.stderr.write('[srv-stderr] ' + d.toString().slice(0,200)));
child.on('error', (e) => { console.log('spawn-error: ' + e.message); finish('FAIL', 'spawn-error=' + e.message); process.exit(0); });
child.stdout.on('data', (d) => { buf = Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });
function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from('Content-Length: '+Buffer.byteLength(b)+'\r\n\r\n'+b)); return new Promise((r)=>pending.set(o.id,r)); }
function call(name,args){ return send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name,arguments:args}}); }
const txt = (r) => (r?.result?.content||[]).map(c=>c.text).join('') || JSON.stringify(r?.result||r?.error||'');
(async () => {
  await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}}});
  const r = await call('huaweicloud_explain_error', { error: '我的ECS启动失败了，帮我分析原因' });
  const t = txt(r);
  const isError = r?.result?.isError === true;
  const hasExplain = /原因|诊断|排障|启动失败|boot|troubleshoot|分析/i.test(t) && t.length > 20;
  console.log('explain_error isError=' + isError + ' len=' + t.length);
  console.log(t.slice(0, 400));
  const ok = !isError && hasExplain;
  console.log('[OK] E08 explain_error 诊断路由=' + ok);
  child.kill(); finish(ok ? 'PASS' : 'FAIL', ok ? '诊断意图走 explain_error 直调, 返回排障分析' : 'explain_error 未返回有效诊断');
  process.exit(0);
})().catch(e => { child.kill(); console.log('EXC '+e.message); finish('FAIL','exception='+e.message); process.exit(0); });
setTimeout(() => { console.log('TIMEOUT'); finish('FAIL','timeout'); process.exit(0); }, 60000);