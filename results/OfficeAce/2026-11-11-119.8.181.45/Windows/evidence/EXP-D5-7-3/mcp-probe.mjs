// MCP stdio probe: initialize + tools/list against installed huaweicloud-devkit (real transport)
import { spawn } from 'child_process';

const BIN = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const child = spawn(process.execPath, [BIN, 'mcp'], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
const pending = new Map();
function send(obj) {
  return new Promise((res) => {
    const id = obj.id;
    pending.set(id, res);
    child.stdin.write(JSON.stringify(obj) + '\n');
  });
}
child.stdout.on('data', (d) => {
  buf += d.toString('utf8');
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    } catch { /* partial line */ }
  }
});
child.stderr.on('data', (d) => process.stderr.write('[srv-err] ' + d.toString('utf8')));

const init = await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '0' } } });
console.log('initialize ok, server:', JSON.stringify(init.result?.serverInfo || {}));
await send({ jsonrpc: '2.0', method: 'notifications/initialized' });
const list = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
const tools = list.result?.tools || [];
console.log('tools/list count =', tools.length);
const bad = tools.filter((t) => !t.inputSchema || typeof t.inputSchema !== 'object');
console.log('badSchemas =', bad.length, bad.map((t) => t.name).join(','));
const huawei = tools.filter((t) => (t.name || '').startsWith('huaweicloud_')).length;
console.log('huaweicloud_* =', huawei);
const allReachable = tools.every((t) => t.name && t.description !== undefined);
console.log('allReachable =', allReachable);
child.kill();
process.exit(0);
