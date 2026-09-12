#!/usr/bin/env node
// P2 D3-B 只读能力发现：list_operations(B1)、plan_cli_command(B2)、run_readonly_command(B3)
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
let buf = Buffer.alloc(0); let seq = 0; const pending = new Map();
function send(method, params = {}) {
  const id = ++seq; const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  return new Promise((r) => pending.set(id, r));
}
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
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3b', version: '1' } });
  await send('notifications/initialized', {});

  // D3-B1 list_operations
  for (const svc of ['ECS', 'VPC', 'OBS']) {
    const r = await send('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: svc } });
    const t = textOf(r);
    check(`D3-B1 list_operations(${svc}) 无 error`, !r.error, r.error?.message || '');
    check(`D3-B1 list_operations(${svc}) 返回操作名`, t.length > 30, `len=${t.length}`);
  }
  const ops = textOf(await send('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ECS' } }));
  console.log('INFO  ECS 操作名样例:', ops.slice(0, 240).replace(/\n/g, ' '));

  // D3-B2 plan_cli_command（只读规划）
  const plan = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ['ECS', 'ListFlavors', '--cli-region=cn-north-4'], allowWrites: false } });
  const pt = textOf(plan);
  check('D3-B2 plan_cli_command 无 error', !plan.error, plan.error?.message || '');
  check('D3-B2 plan_cli_command 返回命令串', /cli-region=cn-north-4/.test(pt) || pt.length > 30, pt.slice(0, 160).replace(/\n/g, ' '));
  let pj = null; try { pj = JSON.parse(pt); } catch {}
  console.log('INFO  plan 摘要:', pt.slice(0, 320).replace(/\n/g, ' '));

  // D3-B3 run_readonly_command（只读执行 + 脱敏）
  const ro = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: ['ECS', 'ListFlavors', '--cli-region=cn-north-4'] } });
  const rt = textOf(ro);
  check('D3-B3 run_readonly_command 无 error', !ro.error, ro.error?.message || '');
  check('D3-B3 输出不含明文 SK/AK', !/\b(SK|secretAccessKey)\b/i.test(rt) || !/AKIA|T:[A-Za-z0-9]{20,}/.test(rt), 'redaction');
  console.log('INFO  run_readonly 摘要:', rt.slice(0, 240).replace(/\n/g, ' '));

  console.log(`\n=== D3-B 只读能力发现汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR:', e.message); child.kill(); process.exit(2); }
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 180000);