// EXP-E04 探针脚本 — 调用 huaweicloud_service_catalog 路由
// 意图: "给这台服务器绑定一个弹性公网IP"
// 期望路由: EIP→plan
import { spawn } from 'node:child_process';

const SERVER = process.argv[2] || 'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\mcp-server.mjs';
const INTENT = "给这台服务器绑定一个弹性公网IP";

function makeServer(path) {
  const child = spawn(process.execPath, [path], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from('Content-Length: ' + Buffer.byteLength(b) + '\r\n\r\n' + b));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, args) { return send({ jsonrpc:'2.0', id:_id++, method:'tools/call', params:{ name, arguments: args||{} } }); }
  return { child, send, call, _id:()=>_id++, kill:()=>child.kill() };
}

(async () => {
  const srv = makeServer(SERVER);
  await srv.send({ jsonrpc:'2.0', id:srv._id(), method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name:'EXP-E04-probe', version:'1' } } });
  srv.send({ jsonrpc:'2.0', method:'notifications/initialized' });
  const resp = await srv.call('huaweicloud_service_catalog', { intent: INTENT });
  const text = resp?.result?.content?.[0]?.text || '';
  let svcs = [];
  try { const j = JSON.parse(text); svcs = j.recommendedServices || []; } catch {}
  console.log(JSON.stringify({ caseId:'EXP-E04', intent:INTENT, recommendedServices:svcs, raw:text.slice(0,200) }));
  srv.kill();
  process.exit(0);
})();
