// D4-7 hook 三工具有效性探针：tools/call 调用 hook_check_command / hook_check_artifacts / hook_check_deploy_plan，核对返回结构化风险结论
import { spawn } from 'node:child_process';
const serverPath = process.argv[2];
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r));}
child.stdout.on('data',d=>{ buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });
(async()=>{
  await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}}});
  send({jsonrpc:'2.0',method:'notifications/initialized'});
  const tests = [
    ['huaweicloud_hook_check_command', { command: 'rm -rf /tmp/foo && dd if=/dev/zero of=/tmp/x count=1' }],
    ['huaweicloud_hook_check_artifacts', { artifacts: { kind: 'IaC', content: 'resource "huaweicloud_ecs_instance" "x" { password = "secret123" }' } }],
    ['huaweicloud_hook_check_deploy_plan', { plan: { sandbox: true, exposure: 'public', iam: 'admin', cost: 'high' } }],
  ];
  for (const [name, args] of tests) {
    const r = await send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name, arguments:args}});
    const txt = r?.result?.content?.[0]?.text || JSON.stringify(r?.error||'');
    const isError = r?.result?.isError;
    console.log(`\n===== ${name} (isError=${isError}) =====`);
    console.log(txt.slice(0, 900));
  }
  console.log('\n=== DONE ==='); child.kill(); process.exit(0);
})().catch(e=>{console.log('ERR',e.message);child.kill();process.exit(1);});
setTimeout(()=>{console.log('TIMEOUT');child.kill();process.exit(1);},40000);