import { spawn } from 'node:child_process';
const p = spawn(process.execPath, ['/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'] });
let buf = Buffer.alloc(0);
const pending = new Map(); let id=1;
function send(o){const b=JSON.stringify(o);p.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));return new Promise(r=>pending.set(o.id,r));}
p.stdout.on('data',d=>{buf=Buffer.concat([buf,d]);while(true){const h=buf.indexOf('\r\n\r\n');if(h<0)break;const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());if(!m){buf=buf.slice(h+4);continue;}const n=+m[1];if(buf.length<h+4+n)break;const body=buf.slice(h+4,h+4+n).toString();buf=buf.slice(h+4+n);const msg=JSON.parse(body);if(msg.id!=null&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}});
// initialize
await send({jsonrpc:'2.0',id:id++,method:'initialize',params:{protocolVersion:'2024-11-05',clientInfo:{name:'x',version:'1'}}});
// invalid params: tools/list with string params
const r1 = await send({jsonrpc:'2.0',id:id++,method:'tools/list',params:'not-an-object'});
console.log('tools/list params=string =>', JSON.stringify(r1));
// invalid params: tools/call missing name
const r2 = await send({jsonrpc:'2.0',id:id++,method:'tools/call',params:{arguments:{}}});
console.log('tools/call missing name =>', JSON.stringify(r2));
// tools/call unknown tool
const r3 = await send({jsonrpc:'2.0',id:id++,method:'tools/call',params:{name:'no_such_tool',arguments:{}}});
console.log('tools/call unknown tool =>', JSON.stringify(r3));
p.kill();
