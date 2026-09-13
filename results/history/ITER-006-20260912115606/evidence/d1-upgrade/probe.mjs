#!/usr/bin/env node
// P3 升级工具冒烟：check_update + upgrade(up_to_date 路径，当前已 latest 不应升级)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
let pass = 0, fail = 0;
function check(name, cond, detail = '') { if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); } else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); } }
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
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'p3upg', version: '1' } });
  await send('notifications/initialized', {});
  const cu = await send('tools/call', { name: 'huaweicloud_check_update', arguments: {} });
  const cut = textOf(cu);
  check('check_update 无 error', !cu.error, cu.error?.message || '');
  console.log('INFO  check_update:', cut.slice(0, 300).replace(/\n/g, ' '));
  const up = await send('tools/call', { name: 'huaweicloud_upgrade', arguments: {} });
  const upt = textOf(up);
  check('upgrade 无 error(走 up_to_date 不执行升级)', !up.error, up.error?.message || '');
  console.log('INFO  upgrade:', upt.slice(0, 400).replace(/\n/g, ' '));
  // 当前已 latest，upgrade 不应返回 requiresRestart=true（无升级动作）
  check('upgrade 当前 latest 不要求重启(无升级动作)', !/requiresRestart.*true/.test(upt), '');
  console.log('\n=== P3 升级冒烟汇总: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR:', e.message); child.kill(); process.exit(2); }
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 180000);