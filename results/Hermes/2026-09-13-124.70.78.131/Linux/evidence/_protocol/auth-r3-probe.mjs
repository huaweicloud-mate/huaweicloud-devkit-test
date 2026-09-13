// D2-11 R3 STS token 拒绝落盘探针
// 通过 MCP tools/call 调 huaweicloud_auth_switch action=persist 且携带 securityToken，
// 期望返回 R3 拒绝（scope=rejected），且不写任何凭证文件。
// 隔离 HUAWEICLOUD_HOME，确保 S1 为空 → 不触发 R2 冲突，直达 R3 门禁。
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const serverPath = process.argv[2];
const isoHome = mkdtempSync(join(tmpdir(), 'hdk-r3-'));
const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_HOME: isoHome },
});
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r));}
child.stdout.on('data',d=>{ buf=Buffer.concat([buf,d]); while(true){ const h=buf.indexOf('\r\n\r\n'); if(h<0)break; const m=/Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString()); if(!m){buf=buf.slice(h+4);continue;} const n=+m[1]; if(buf.length<h+4+n)break; const body=buf.slice(h+4,h+4+n).toString(); buf=buf.slice(h+4+n); try{const msg=JSON.parse(body); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}}catch{} } });
(async()=>{
  await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1'}}});
  send({jsonrpc:'2.0',method:'notifications/initialized'});
  // action=persist + securityToken（dummy STS）→ 期望 R3 拒绝
  const r = await send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{
    name:'huaweicloud_auth_switch', arguments:{action:'persist', mode:'memory', ak:'FAKEAK', sk:'FAKESK', securityToken:'FAKE-STS-TOKEN', region:'cn-north-4'}
  }});
  const txt = r?.result?.content?.[0]?.text || JSON.stringify(r?.error||'');
  console.log('=== auth_switch persist + STS token (expect R3) ===');
  console.log(txt.slice(0, 800));
  // 断言：必须包含 R3 / rejected / Temporary STS / cannot be persisted 之一
  const r3 = /R3|cannot be persisted|Temporary STS|scope.*rejected/i.test(txt);
  console.log(`>>> R3 拒绝判定: ${r3}`);
  // 隔离 S1 应无凭证文件被写（R3 早退，不落盘）
  const credFile = join(isoHome, '.config', 'huaweicloud', 'credentials.json');
  console.log(`>>> 隔离S1凭证文件是否被写入: ${existsSync(credFile)}`);
  console.log('=== DONE ==='); child.kill(); process.exit(r3 && !existsSync(credFile) ? 0 : 1);
})().catch(e=>{console.log('ERR',e.message);child.kill();process.exit(1);});
setTimeout(()=>{console.log('TIMEOUT');child.kill();process.exit(1);},30000);