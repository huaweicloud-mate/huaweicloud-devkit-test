#!/usr/bin/env node
// D3-B8 voucher_status + 账户余额（只读，评估 ECS 可否购买）
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }
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
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3b8', version: '1' } });
  await send('notifications/initialized', {});
  // D3-B8 voucher_status
  const vs = await send('tools/call', { name: 'huaweicloud_voucher_status', arguments: {} });
  const vst = textOf(vs);
  check('D3-B8 voucher_status 无 error', !vs.error, vs.error?.message || '');
  console.log('INFO  voucher_status:', vst.slice(0, 400).replace(/\n/g, ' '));
  // 账户余额（BSS 只读）
  const bal = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: ['BSS', 'ShowCustomerAccountBalances'] } });
  const bt = textOf(bal);
  check('账户余额查询无 error', !bal.error, bal.error?.message || '');
  console.log('INFO  余额:', bt.slice(0, 400).replace(/\n/g, ' '));
  console.log(`\n=== D3-B8/余额汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); child.kill(); process.exit(2); }
setTimeout(() => { child.kill(); process.exit(3); }, 120000);