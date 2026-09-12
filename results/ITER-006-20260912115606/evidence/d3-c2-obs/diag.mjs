#!/usr/bin/env node
// OBS 诊断：完整建桶输出 + OBS 命令列表
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const BUCKET = `tctest-static-${Date.now()}`;
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
async function run(args) {
  const p = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args, allowWrites: true } });
  let pj = null; try { pj = JSON.parse(textOf(p)); } catch {}
  const r = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args, approvalToken: pj?.approvalToken, approvedByUser: true } });
  return textOf(r);
}
try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'obsdiag', version: '1' } });
  await send('notifications/initialized', {});
  // OBS 命令列表
  const lo = await send('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'OBS' } });
  console.log('===== OBS list_operations =====');
  console.log(textOf(lo).slice(0, 700));
  console.log('\n===== 完整建桶输出 =====');
  console.log(await run(['OBS', 'mb', `obs://${BUCKET}`]));
  child.kill(); process.exit(0);
} catch (e) { console.error('ERR', e.message); child.kill(); process.exit(2); }
setTimeout(() => { child.kill(); process.exit(3); }, 120000);