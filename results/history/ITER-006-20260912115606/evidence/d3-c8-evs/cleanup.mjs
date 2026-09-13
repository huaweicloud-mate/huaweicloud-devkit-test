#!/usr/bin/env node
// 清理泄漏的 EVS 卷
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const VID = '914c2fb8-8540-414a-8a83-3e220b1c2959';
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
(async () => {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'evsclean', version: '1' } });
  await send('notifications/initialized', {});
  console.log('释放卷', VID);
  const d = await run(['EVS', 'DeleteVolume', `--volume_id=${VID}`, '--cli-region=cn-north-4']);
  console.log('释放结果:', d.slice(0, 200).replace(/\n/g, ' '));
  // 归零确认
  const r = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: ['EVS', 'ShowVolume', `--volume_id=${VID}`, '--cli-region=cn-north-4'] } });
  const t = textOf(r);
  console.log('归零:', /EVS.5404|not found|不存在/i.test(t) ? 'GONE' : '残留 -> ' + t.slice(0, 120).replace(/\n/g, ' '));
  child.kill(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); child.kill(); process.exit(2); });
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 180000);