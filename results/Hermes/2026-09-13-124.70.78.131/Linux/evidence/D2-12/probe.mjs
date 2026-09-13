// D2-12 R10 runtime 非空禁止落盘探针
// 1) auth_switch action=temporary 设置 runtime 凭证（仅内存，不落盘）
// 2) auth_sync 应返回 R10 拒绝（runtime active，auto-sync suppressed），不写 OBS/hcloud。
import { spawn } from 'node:child_process';
const serverPath = process.argv[2];
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r));}
child.stdout.on('data',d=>{ buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });
function callText(r){ return r?.result?.content?.[0]?.text || JSON.stringify(r?.error||''); }
(async()=>{
  await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}}});
  send({jsonrpc:'2.0',method:'notifications/initialized'});
  const a = await send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name:'huaweicloud_auth_switch', arguments:{action:'temporary', mode:'memory', ak:'FAKEAK', sk:'FAKESK'}}});
  console.log('=== auth_switch action=temporary (set runtime) ===');
  console.log(callText(a).slice(0, 500));
  const b = await send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name:'huaweicloud_auth_sync', arguments:{}}});
  const txt = callText(b);
  console.log('\n=== auth_sync (expect R10) ===');
  console.log(txt.slice(0, 800));
  const r10 = /R10|suppressed|Runtime credentials are active/i.test(txt);
  console.log(`>>> R10 拒绝判定: ${r10}`);
  console.log('=== DONE ==='); child.kill(); process.exit(r10 ? 0 : 1);
})().catch(e=>{console.log('ERR',e.message);child.kill();process.exit(1);});
setTimeout(()=>{console.log('TIMEOUT');child.kill();process.exit(1);},30000);