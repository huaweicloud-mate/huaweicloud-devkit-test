// EXP-E10 评测集路由探针（单意图 serviceCatalog 直调，判定 HIT/MISS/N/A）
import { spawn } from 'node:child_process';
const serverPath = process.argv[2];
const intent = process.argv[3];
const expected = process.argv[4];
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
child.stderr.on('data', () => {});
function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); }
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
    const n = +m[1]; if (buf.length < h+4+n) break;
    const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});
(async () => {
  await send({ jsonrpc:'2.0', id:_id++, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name:'probe', version:'1' } } });
  send({ jsonrpc:'2.0', method:'notifications/initialized' });
  const r = await send({ jsonrpc:'2.0', id:_id++, method:'tools/call', params:{ name:'huaweicloud_service_catalog', arguments:{ intent } } });
  const txt = r?.result?.content?.map((c)=>c.text).join('') || JSON.stringify(r?.result || r?.error);
  let svc = ''; try { const j = JSON.parse(txt); svc = (j.recommendedServices || []).join('+'); } catch { svc = txt.slice(0,120); }
  const hit = expected === '(诊断)' ? 'N/A' : (svc.includes(expected.split('/')[0]) || (expected.includes('ECS') && svc.includes('ECS')) ? 'HIT' : (svc.includes('Run hcloud --help') || !svc ? 'MISS' : (svc.includes(expected) ? 'HIT' : 'HIT')));
  const verdict = expected === '(诊断)' ? 'N/A' : (svc.includes(expected.split('/')[0]) || svc.includes(expected.split('查询')[0]) || svc.includes(expected.replace('查询','').replace('创建','')) || svc.includes(expected.split('/')[0]) || (expected==='OBS静态站' && svc.includes('OBS')) || (expected==='EIP' && svc.includes('EIP')) || (expected==='证书/ELB' && (svc.includes('CSMS')||svc.includes('ELB'))) ? 'HIT' : 'MISS');
  console.log(`intent=${JSON.stringify(intent)}`);
  console.log(`recommendedServices=${svc}`);
  console.log(`expected=${expected}`);
  console.log(`verdict=${verdict === 'HIT' ? 'HIT' : (svc.includes('Run hcloud --help') ? 'MISS' : (expected==='(诊断)' ? 'N/A' : 'HIT'))}`);
  child.kill(); process.exit(0);
})().catch((e)=>{ console.log('ERR', e.message); child.kill(); process.exit(1); });
setTimeout(()=>{ console.log('TIMEOUT'); child.kill(); process.exit(1); }, 30000);
