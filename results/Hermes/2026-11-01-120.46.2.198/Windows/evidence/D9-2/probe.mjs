import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const rec = (status, why) => { const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D9-2' }; writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2)); console.log(JSON.stringify(out)); };
function makeServer() {
  const child = spawn(process.execPath, [SERVER], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise(r => pending.set(o.id, r)); }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0,h).toString());
      if (!m) { buf = buf.slice(h+4); continue; }
      const n = +m[1]; if (buf.length < h+4+n) break;
      const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  return { child, send, kill: () => child.kill() };
}
await (async () => {
const srv = makeServer(); const init = await srv.send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name:'probe', version:'1' } } }); srv.send({ jsonrpc:'2.0', method:'notifications/initialized' });
const u = await srv.send({ jsonrpc:'2.0', id:3, method:'tools/unknown_xyz', params:{} });
const bad = await srv.send({ jsonrpc:'2.0', id:4, method:'tools/list', params:'not-an-object' });
const a = u?.error?.code; const b = bad?.error?.code;
rec((a === -32601 && b === -32602) ? 'PASS':'FAIL', 'unknown-method=' + a + ' invalid-params=' + b + ' (期望 -32601/-32602)');
})();
process.exit(0);
