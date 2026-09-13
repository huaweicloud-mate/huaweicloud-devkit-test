#!/usr/bin/env node
// D3-C7 完整 E2E：创建最小 EIP(5_bgp/1M/PER) → 提取 id → 释放 → 归零验证
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const REGION = 'cn-north-4';
const TAG = `tctest-eip-${Date.now()}`;

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); }
}
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

async function planAndRun(args) {
  // plan → token
  const p = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args, allowWrites: true } });
  let pj = null; try { pj = JSON.parse(textOf(p)); } catch {}
  const tok = pj?.approvalToken;
  if (!tok) return { error: { message: 'no approvalToken' } };
  // approve → execute
  const r = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args, approvalToken: tok, approvedByUser: true } });
  const t = textOf(r);
  let inner = null; try { inner = JSON.parse(t).stdout ? JSON.parse(JSON.parse(t).stdout) : JSON.parse(t); } catch {}
  return { result: inner, error: r.error, raw: t };
}

let createdId = null;

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3c7', version: '1' } });
  await send('notifications/initialized', {});

  // 创建
  const createArgs = ['EIP', 'CreatePublicip', `--publicip.type=5_bgp`, `--bandwidth.size=1`, `--bandwidth.share_type=PER`, `--bandwidth.name=${TAG}`, `--cli-region=${REGION}`];
  const c = await planAndRun(createArgs);
  if (c.error) { check('D3-C7 创建 EIP 成功', false, c.error.message || c.raw.slice(0, 100)); }
  else {
    const id = c.result?.publicip?.id || c.result?.publicip_id || c.result?.id;
    createdId = id || null;
    check('D3-C7 创建 EIP 成功并返回 id', !!id, `id=${String(id).slice(0, 12)}...`);
    console.log('INFO  创建结果:', (id ? 'id=' + id : c.raw.slice(0, 200).replace(/\n/g, ' ')));
  }

  // 释放（务必清理）
  if (createdId) {
    const delArgs = ['EIP', 'DeletePublicip', `--publicip_id=${createdId}`, `--cli-region=${REGION}`];
    const d = await planAndRun(delArgs);
    check('D3-C7 释放 EIP 成功(无 error)', !d.error, d.error?.message || '');
    console.log('INFO  释放结果:', d.error ? d.error.message : 'ok');
  }

  // 归零验证：列出该 tag 的 EIP（应不存在）
  const listArgs = ['EIP', 'ListPublicips', `--cli-region=${REGION}`];
  const l = await planAndRun(listArgs);
  const lt = l.raw || JSON.stringify(l.result || {});
  const leftover = new RegExp(TAG).test(lt);
  check('D3-C7 归零(无 tctest- 残留)', !leftover, leftover ? '发现残留' : '归零');

  console.log(`\n=== D3-C7 EIP E2E 汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error('PROBE_ERROR:', e.message);
  // 兜底清理
  if (createdId) { try { await planAndRun(['EIP', 'DeletePublicip', `--publicip_id=${createdId}`, `--cli-region=${REGION}`]); console.log('CLEANUP 已释放', createdId); } catch {} }
  child.kill(); process.exit(2);
}
setTimeout(() => { console.error('TIMEOUT'); if (createdId) console.log('CLEANUP 需手动释放 id=', createdId); child.kill(); process.exit(3); }, 300000);