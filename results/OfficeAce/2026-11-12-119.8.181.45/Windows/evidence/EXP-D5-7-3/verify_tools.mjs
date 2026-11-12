// EXP-D5-7-3 verification: spawn huaweicloud-core MCP server over stdio, call tools/list,
// verify full inventory + schema completeness (design D5-3 on OfficeAce/Windows).
// Rewrites evidence/EXP-D5-7-3/stdout.log with the real measured values.
import { spawn } from 'node:child_process';

const SERVER = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
const pending = new Map();
function send(msg) {
  return new Promise((res) => {
    const id = msg.id;
    pending.set(id, res);
    child.stdin.write(JSON.stringify(msg) + '\n');
  });
}
child.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.id && pending.has(obj.id)) {
        pending.get(obj.id)(obj);
        pending.delete(obj.id);
      }
    } catch {}
  }
});
child.stderr.on('data', (d) => process.stderr.write(d));

const init = await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'officeace-verify', version: '0.0.1' } } });
console.log('initialize ok:', !!init.result);
await send({ jsonrpc: '2.0', method: 'notifications/initialized' });
const list = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
const tools = list.result?.tools || [];
let schemaOk = 0;
for (const t of tools) {
  if (t.name && t.description !== undefined && t.inputSchema && t.inputSchema.type === 'object') schemaOk++;
}
console.log(JSON.stringify({ toolCount: tools.length, schemaOk, server: 'huaweicloud-core mcp-server.mjs (local hdk@1.1.14-next.2)' }, null, 2));
child.kill();
process.exit(0);
