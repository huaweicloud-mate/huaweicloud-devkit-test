import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const MCP = process.argv[2];
function frame(o){const j=JSON.stringify(o);return 'Content-Length: '+Buffer.byteLength(j,'utf8')+'\r\n\r\n'+j;}
const p = spawn(process.execPath,[MCP],{stdio:['pipe','pipe','pipe']});
let out='';
p.stdout.on('data',d=>{out+=d.toString();});
setTimeout(()=>p.stdin.write(frame({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1.0'}}})),200);
setTimeout(()=>p.stdin.write(frame({jsonrpc:'2.0',id:2,method:'tools/list',params:{}})),900);
setTimeout(()=>p.stdin.end(),1800);
setTimeout(()=>p.kill(),6000);
p.on('exit',()=>{
  const parts=out.split(/Content-Length:\s*\d+\s*\r\n\r\n/).filter(Boolean);
  const parsed=[];for(const s of parts){try{parsed.push(JSON.parse(s));}catch{}}
  const r2=parsed.find(r=>r.id===2);
  const tools=(r2&&r2.result&&r2.result.tools)||[];
  writeFileSync(process.argv[3],JSON.stringify(tools,null,1));
  console.log('tools='+tools.length);
  for(const t of tools){const ks=Object.keys((t.inputSchema&&t.inputSchema.properties)||{});console.log(t.name+' :: '+ks.join(','));}
});
