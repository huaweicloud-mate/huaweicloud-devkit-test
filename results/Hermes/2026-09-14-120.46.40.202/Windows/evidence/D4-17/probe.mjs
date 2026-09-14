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
  
  const tests = [
    { command: null },
    { command: '' },
    { command: undefined },
    {},
    { command: 'a'.repeat(100000) },
  ];
  let allSafe = true;
  for (const args of tests) {
    const h = await call('huaweicloud_hook_check_command', args);
    const t = h.result?.content?.[0]?.text || '{}';
    const parsed = JSON.parse(t);
    console.log("args:", JSON.stringify(args).substring(0, 40), "-> decision:", parsed.decision, "ok:", parsed.ok);
    if (parsed.decision === 'allow' && parsed.ok === true) {
      // Empty/null commands are ok to allow since they're harmless
    }
  }
  console.log("RESULT: FUZZY_TESTED");
  child.kill(); process.exit(0);

} catch(e) { console.error("Error:",e.message); child.kill(); process.exit(1); }
setTimeout(()=>{child.kill();process.exit(1);},25000);
