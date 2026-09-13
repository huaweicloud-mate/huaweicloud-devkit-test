#!/usr/bin/env node
// P2 真云只读准备：auth_status（三端就绪）+ list_regions（区域发现）
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); }
}

const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0);
let seq = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++seq;
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  return new Promise((r) => pending.set(id, r));
}
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n');
    if (i === -1) return;
    const m = buf.subarray(0, i).toString('utf8').match(/Content-Length: (\d+)/i);
    if (!m) { buf = buf.subarray(i + 4); continue; }
    const len = Number(m[1]);
    if (buf.length < i + 4 + len) return;
    let msg; try { msg = JSON.parse(buf.subarray(i + 4, i + 4 + len).toString('utf8')); } catch { buf = buf.subarray(i + 4 + len); continue; }
    buf = buf.subarray(i + 4 + len);
    const r = pending.get(msg.id); if (r) { pending.delete(msg.id); r(msg); }
  }
});
child.stderr.on('data', () => {});

function textOf(r) { return (r.result?.content || []).map((x) => x.text || '').join(''); }

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'p2-ro', version: '1' } });
  await send('notifications/initialized', {});

  // D2 auth_status：三端就绪（只读）
  const as = await send('tools/call', { name: 'huaweicloud_auth_status', arguments: {} });
  const ast = textOf(as);
  check('D2 auth_status 无 error', !as.error, as.error?.message || '');
  console.log('INFO  auth_status:', ast.slice(0, 400).replace(/\n/g, ' '));

  // D3-A5 list_regions：区域发现（只读）
  const lr = await send('tools/call', { name: 'huaweicloud_list_regions', arguments: {} });
  const lrt = textOf(lr);
  check('D3-A5 list_regions 无 error', !lr.error, lr.error?.message || '');
  let lrjson = null; try { lrjson = JSON.parse(lrt); } catch {}
  const regionIds = (lrjson?.regions || []).map((r) => r.id || r.region || r).slice(0, 8);
  check('D3-A5 list_regions 返回区域列表', (lrjson?.regions || []).length > 0, `前 ${regionIds.length} 个: ${regionIds.join(',')}`);
  console.log('INFO  regions 前 8:', regionIds.join(', '));

  console.log(`\n=== P2 真云只读准备汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill();
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error('PROBE_ERROR:', e.message);
  child.kill();
  process.exit(2);
}
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 90000);