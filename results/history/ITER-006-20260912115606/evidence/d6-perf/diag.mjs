#!/usr/bin/env node
// D6-4 并发诊断：逐个调用 6 工具看响应类型（result vs error）
import { spawn } from 'node:child_process';
const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0), seq = 0; const pending = new Map();
function send(method, params = {}) { const id = ++seq; const m = JSON.stringify({ jsonrpc: '2.0', id, method, params }); child.stdin.write(`Content-Length: ${Buffer.byteLength(m)}\r\n\r\n${m}`); return new Promise((r) => pending.set(id, r)); }
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n'); if (i === -1) return;
    const m = buf.subarray(0, i).toString('utf8').match(/Content-Length: (\d+)/i);
    if (!m) { buf = buf.subarray(i + 4); continue; }
    const len = Number(m[1]); if (buf.length < i + 4 + len) return;
    let msg; try { msg = JSON.parse(buf.subarray(i + 4, i + 4 + len).toString('utf8')); } catch { buf = buf.subarray(i + 4 + len); continue; }
    buf = buf.subarray(i + 4 + len); const r = pending.get(msg.id); if (r) { pending.delete(msg.id); r(msg); }
  }
});
child.stderr.on('data', () => {});
async function tool(name, args) { const r = await send('tools/call', { name, arguments: args }); return r; }
try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd', version: '1' } });
  await send('notifications/initialized', {});
  const cases = [
    ['huaweicloud_list_regions', {}],
    ['huaweicloud_voucher_status', {}],
    ['huaweicloud_search_docs', { query: 'obs' }],
    ['huaweicloud_retrieve_skill', { skill: 'huawei-ecs' }],
    ['huaweicloud_list_operations', { service: 'ECS' }],
    ['huaweicloud_detect_framework', {}],
  ];
  for (const [n, a] of cases) {
    const r = await tool(n, a);
    const kind = r.error ? 'JSONRPC_ERROR' : (r.result?.isError ? 'result.isError=true' : 'result(ok)');
    console.log(`${n}: ${kind} | ${r.error ? JSON.stringify(r.error).slice(0,80) : ''}`);
  }
  process.exit(0);
} catch (e) { console.error(e.message); process.exit(2); }
setTimeout(() => process.exit(3), 60000);