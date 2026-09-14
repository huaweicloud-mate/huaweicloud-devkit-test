import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ["C:/Users/Administrator/devkit-test/hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs"], { cwd: "C:/Users/Administrator/devkit-test/hermes/hdk", stdio: ['pipe', 'pipe', 'pipe'] });
let buffer = Buffer.alloc(0); const pending = new Map();
child.stdout.on('data', (chunk) => { buffer = Buffer.concat([buffer, chunk]);
  while (true) { const he = buffer.indexOf('\r\n\r\n'); if (he===-1) return;
    const h = buffer.subarray(0,he).toString('utf8'); const m = h.match(/Content-Length:\s*(\d+)/i); if(!m) return;
    const l = Number(m[1]); const bs = he+4; const be = bs+l; if(buffer.length<be) return;
    const p = JSON.parse(buffer.subarray(bs,be).toString('utf8')); buffer = buffer.subarray(be);
    pending.get(p.id)?.(p); } });
child.stderr.on('data', () => {});
function frame(msg) { const j=JSON.stringify(msg); return `Content-Length: ${Buffer.byteLength(j)}\r\n\r\n${j}`; }
function request(method, params={}) { const id=Math.floor(Math.random()*1e6);
  child.stdin.write(frame({jsonrpc:'2.0',id,method,params}));
  return new Promise((res,rej)=>{ const t=setTimeout(()=>rej(new Error('Timeout '+method)),15000);
    pending.set(id,(p)=>{clearTimeout(t);pending.delete(id);res(p);}); }); }
function call(name,args={}) { return request('tools/call',{name,arguments:args}); }
try { await request('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'p',version:'1'}});
  
  const result = await call('huaweicloud_check_update', {});
  console.log("isError:", result.result?.isError);
  const text = result.result?.content?.[0]?.text || '';
  console.log("content (first 500):", text.substring(0, 500));
  console.log("RESULT: CHECK_UPDATE_DONE");
  child.kill(); process.exit(0);

} catch(e) { console.error("Error:",e.message); child.kill(); process.exit(1); }
setTimeout(()=>{child.kill();process.exit(1);},25000);
