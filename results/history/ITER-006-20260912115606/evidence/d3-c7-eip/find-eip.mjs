#!/usr/bin/env node
// 定位 EIP 正确的 KooCLI 服务/操作
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
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
const textOf = (r) => (r.result?.content || []).map((x) => x.text || '').join('');
try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'eipfind', version: '1' } });
  await send('notifications/initialized', {});
  // VPC --help 里找 EIP/Publicip/bandwidth 相关 operation
  for (const svc of ['VPC', 'EIP']) {
    const r = await send('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: svc } });
    const t = textOf(r);
    console.log(`===== ${svc} 内 EIP/Publicip/bandwidth 相关操作 =====`);
    const hits = t.split('\n').filter((l) => /publicip|\.EIP|Bandwidth|bandwidth|ElasticIp/i.test(l));
    console.log(hits.length ? hits.slice(0, 40).join('\n') : '(该服务无匹配/服务名无效: ' + t.slice(0, 120) + ')');
  }
  child.kill(); process.exit(0);
} catch (e) { console.error('ERR', e.message); child.kill(); process.exit(2); }
setTimeout(() => { child.kill(); process.exit(3); }, 120000);