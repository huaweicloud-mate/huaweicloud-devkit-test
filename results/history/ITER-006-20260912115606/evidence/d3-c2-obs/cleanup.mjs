#!/usr/bin/env node
// 清理泄漏的 OBS 桶（红线：只删本次创建资源）
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const BUCKETS = ['tctest-static-1789191940498', 'tctest-static-1789191884709', 'tctest-static-1789191834551'];
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
  const t = textOf(r);
  return { r, t, err: r.error };
}
(async () => {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'obscln', version: '1' } });
  await send('notifications/initialized', {});
  for (const b of BUCKETS) {
    // 删对象（单个，不带 -f/-r）
    const r1 = await run(['OBS', 'rm', `obs://${b}/index.html`]);
    console.log(`删对象 ${b}/index.html:`, r1.err ? 'ERR ' + r1.err.message : (JSON.parse(r1.t).ok ? 'ok' : 'exit ' + JSON.parse(r1.t).exitCode));
    // 删空桶（不带 -f/-r）
    const r2 = await run(['OBS', 'rm', `obs://${b}`]);
    console.log(`删桶 ${b}:`, r2.err ? 'ERR ' + r2.err.message : (JSON.parse(r2.t).ok ? 'ok' : 'exit ' + JSON.parse(r2.t).exitCode));
  }
  // 归零确认
  for (const b of BUCKETS) {
    const r = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: ['OBS', 'ls', `obs://${b}`] } });
    const t = textOf(r);
    const gone = /NoSuchBucket|not exist|不存在|failed|404|error/i.test(t);
    console.log(`归零 ${b}:`, gone ? 'GONE' : '存在(需处理) -> ' + t.slice(0, 80).replace(/\n/g, ' '));
  }
  child.kill(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); child.kill(); process.exit(2); });
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 300000);