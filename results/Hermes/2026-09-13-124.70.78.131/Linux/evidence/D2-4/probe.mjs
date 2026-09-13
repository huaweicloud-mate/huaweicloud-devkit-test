import { spawn } from 'node:child_process';
const child = spawn(process.execPath, [process.argv[2]], { stdio:['pipe','pipe','pipe'] });
let buf=Buffer.alloc(0); const pending=new Map(); let _id=1;
function send(o){const b=JSON.stringify(o);child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));return new Promise(r=>pending.set(o.id,r));}
child.stdout.on('data',d=>{buf=Buffer.concat([buf,d]);while(true){const h=buf.indexOf('\r\n\r\n');if(h<0)break;const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());if(!m){buf=buf.slice(h+4);continue;}const n=+m[1];if(buf.length<h+4+n)break;const body=buf.slice(h+4,h+4+n).toString();buf=buf.slice(h+4+n);try{const msg=JSON.parse(body);if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{}}});
(async()=>{
  await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}}});
  send({jsonrpc:'2.0',method:'notifications/initialized'});
  // show_profile_redacted
  for (const name of ['huaweicloud_show_profile_redacted','huaweicloud_auth_status']) {
    const r = await send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name,arguments:{}}});
    const txt = r?.result?.content?.[0]?.text || JSON.stringify(r?.error||'');
    console.log(`\n===== ${name} =====`);
    console.log(txt.slice(0,1200));
    // 检测泄露
    const leak = /(AKIA[0-9A-Z]{16}|[A-Z0-9]{20,})|(secretKey|SecretKey|accessKey|AccessKey)\"?\s*[:=]\s*\"?[A-Za-z0-9/+=]{20,}/.test(txt);
    console.log(`\n>>> 疑似密钥泄露?: ${leak}`);
  }
  console.log('\n=== DONE ==='); child.kill(); process.exit(0);
})().catch(e=>{console.log('ERR',e.message);child.kill();process.exit(1);});
setTimeout(()=>{console.log('TIMEOUT');child.kill();process.exit(1);},30000);
