import { spawn } from 'node:child_process';
export function makeServer(serverPath, env={}) {
  const child = spawn(process.execPath, [serverPath], { stdio:['pipe','pipe','pipe'], env:{...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE:'local', ...env} });
  let buf = Buffer.alloc(0);
  const pending = new Map(); let _id = 1;
  const listeners = [];
  child.stdout.on('data', d => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());
      if (!m) { buf = buf.slice(h+4); continue; }
      const n = +m[1]; if (buf.length < h+4+n) break;
      const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else if (msg.method) { for (const l of listeners) l(msg); } } catch {}
    }
  });
  child.stderr.on('data', d => { for (const l of [...errListeners]) l(d); });
  const errListeners = [];
  function send(o){ const b=JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r=>pending.set(o.id,r)); }
  async function call(name, args) { return send({jsonrpc:'2.0',id:_id++,method:'tools/call',params:{name,arguments:args||{}}}); }
  async function init() {
    await send({jsonrpc:'2.0',id:_id++,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'eval',version:'1'}}});
    send({jsonrpc:'2.0',method:'notifications/initialized'});
  }
  return { child, send, call, init, kill: () => child.kill(), onStderr:(f)=>errListeners.push(f) };
}
export function toolText(resp) {
  return resp?.result?.content?.[0]?.text ?? '';
}
