// D9-2 JSON-RPC 错误码探针：逐一构造非法请求，核对错误码
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(obj){ const b=JSON.stringify(obj); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(obj.id,r));}
child.stdout.on('data',d=>{ buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });
async function rpc(method, params, id){ const p=send({jsonrpc:'2.0',id,method,params}); return p; }
(async()=>{
  // initialize first
  const i=await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}},_id++);
  console.log('initialize.result?', !!i.result);
  send({jsonrpc:'2.0',method:'notifications/initialized'});

  // 1. unknown METHOD -> expect -32601
  const a=await rpc('__no_such_method__',{},_id++);
  console.log('unknown method     =>', JSON.stringify(a.error||a.result));

  // 2. tools/call unknown tool -> expect -32602 (per spec, invalid params), actual?
  const b=await rpc('tools/call',{name:'__no_such_tool__',arguments:{}},_id++);
  console.log('tools/call unknown =>', JSON.stringify(b.error||b.result));

  // 3. tools/list with garbage param type (should still work or -32602)
  const c=await rpc('tools/list',{bogus:123},_id++);
  console.log('tools/list bogus   =>', JSON.stringify(c.error||{result:`${(c.result?.tools||[]).length} tools`}));

  // 4. initialize with wrong protocolVersion (version negotiation)
  const d=await rpc('initialize',{protocolVersion:'1999-01-01',capabilities:{},clientInfo:{name:'probe',version:'1'}},_id++);
  console.log('old protocol ver   =>', JSON.stringify(d.error||{result: d.result?.protocolVersion}));

  console.log('=== DONE ==='); child.kill(); process.exit(0);
})().catch(e=>{console.log('ERR',e.message);child.kill();process.exit(1);});
setTimeout(()=>{console.log('TIMEOUT');child.kill();process.exit(1);},30000);