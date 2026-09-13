#!/usr/bin/env node
// D3-B7 审批链：deny → approve → execute；单次消费；参数篡改（用只读命令避免创建资源）
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

const ARGS = ['ECS', 'ListFlavors', '--cli-region=cn-north-4'];

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3b7', version: '1' } });
  await send('notifications/initialized', {});

  // plan → token
  const plan = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ARGS, allowWrites: false } });
  const pt = textOf(plan);
  let pj = null; try { pj = JSON.parse(pt); } catch {}
  const token = pj?.approvalToken || '';
  check('D3-B7 plan 产出 approvalToken', !!token, `token=${String(token).slice(0, 8)}...`);
  check('D3-B7 plan.command 为展示字段(含脱敏)', typeof pj?.command === 'string' && pj.command.startsWith('hcloud'), '');

  // 1) deny：approvedByUser=false → 拒绝
  const deny = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args: ARGS, approvalToken: token, approvedByUser: false } });
  check('D3-B7 deny(approvedByUser=false) 被拒绝', !!deny.error, deny.error?.message || '未拒绝(缺陷)');
  if (deny.error) console.log('INFO  deny 提示:', deny.error.message);

  // 2) approve → execute（只读命令，安全）
  const run = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args: ARGS, approvalToken: token, approvedByUser: true } });
  const rt = textOf(run);
  let runJson = null; try { runJson = JSON.parse(rt); } catch {}
  check('D3-B7 approve→execute 执行成功(approved=true)', !run.error && runJson?.approved === true, run.error?.message || ('approved=' + runJson?.approved));
  console.log('INFO  execute approved=', runJson?.approved, '| exitCode=', runJson?.exitCode);

  // 3) 单次消费：同一 token 复用 → 拒绝
  const reuse = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args: ARGS, approvalToken: token, approvedByUser: true } });
  check('D3-B7 单次消费(复用 token 拒绝)', !!reuse.error, reuse.error?.message || '复用成功(缺陷)');
  if (reuse.error) console.log('INFO  reuse 提示:', reuse.error.message);

  // 4) 参数篡改：新 token 但改了 args → 拒绝
  const plan2 = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ARGS, allowWrites: false } });
  let pj2 = null; try { pj2 = JSON.parse(textOf(plan2)); } catch {}
  const tamperedArgs = ['ECS', 'ListFlavors', '--cli-region=ap-southeast-1']; // 区域被改
  const tamper = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args: tamperedArgs, approvalToken: pj2?.approvalToken, approvedByUser: true } });
  check('D3-B7 参数篡改(改 region)被拒绝', !!tamper.error, tamper.error?.message || '篡改执行成功(缺陷)');
  if (tamper.error) console.log('INFO  tamper 提示:', tamper.error.message);

  console.log(`\n=== D3-B7 审批链汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR:', e.message); child.kill(); process.exit(2); }
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 180000);