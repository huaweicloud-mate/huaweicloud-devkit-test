// test-service-catalog.mjs: Check service_catalog responses
import { spawn } from 'node:child_process';

const serverPath = 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
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
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

function getText(resp) {
  if (resp?.result?.isError) return JSON.stringify(resp.result);
  return resp?.result?.content?.[0]?.text || '';
}

const srv = makeServer(serverPath);
await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const intents = [
  'deploy app',
  'deploy a web application with database',
  'deploy my project to huawei cloud with rds',
  '我想部署一个带数据库的Web应用',
];

for (const intent of intents) {
  const resp = await srv.call('huaweicloud_service_catalog', { intent });
  const text = getText(resp);
  console.log(`\nIntent: ${intent}`);
  console.log(`Response (first 500 chars): ${text.substring(0, 500)}`);
  console.log('---');
}

srv.kill();
process.exit(0);
