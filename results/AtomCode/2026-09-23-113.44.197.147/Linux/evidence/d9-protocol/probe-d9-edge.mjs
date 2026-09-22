import { spawn } from 'node:child_process';
const SP='/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
function make(){const p=spawn(process.execPath,[SP],{stdio:['pipe','pipe','pipe']});let buf=Buffer.alloc(0);const pend=new Map();let id=1;function send(o){const b=JSON.stringify(o);p.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));return new Promise(r=>pend.set(o.id,r));}p.stdout.on('data',d=>{buf=Buffer.concat([buf,d]);while(true){const h=buf.indexOf('\r\n\r\n');if(h<0)break;const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());if(!m){buf=buf.slice(h+4);continue;}const n=+m[1];if(buf.length<h+4+n)break;const body=buf.slice(h+4,h+4+n).toString();buf=buf.slice(h+4+n);let msg;try{msg=JSON.parse(body)}catch{continue}if(msg.id!=null&&pend.has(msg.id)){pend.get(msg.id)(msg);pend.delete(msg.id);}}});return{send,kill:()=>p.kill()};}

// D9-4: tools/call BEFORE initialize (非法时序)
{
  const s=make();
  const r=await s.send({jsonrpc:'2.0',id:1,method:'tools/list',params:{}});
  console.log('D9-4 tools/list before initialize =>', JSON.stringify(r).slice(0,200));
  s.kill();
}
// D9-7: older protocol version
{
  const s=make();
  const r=await s.send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-10-01',clientInfo:{name:'old',version:'1'}}});
  console.log('D9-7 protocolVersion=2024-10-01 =>', JSON.stringify(r).slice(0,260));
  s.kill();
}
// D9-7: newer/unknown protocol version
{
  const s=make();
  const r=await s.send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2099-01-01',clientInfo:{name:'future',version:'1'}}});
  console.log('D9-7 protocolVersion=2099-01-01 =>', JSON.stringify(r).slice(0,260));
  s.kill();
}
// D9-4: capabilities negotiation
{
  const s=make();
  const r=await s.send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'x',version:'1'}}});
  console.log('D9-4 capabilities =>', JSON.stringify(r?.result?.capabilities));
  s.kill();
}
