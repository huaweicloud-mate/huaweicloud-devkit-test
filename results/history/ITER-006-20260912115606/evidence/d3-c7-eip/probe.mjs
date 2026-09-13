#!/usr/bin/env node
// D3-C7 跨区域 EIP：plan 发现必填参数 → 创建最小 EIP → 释放 → 归零验证
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
let buf = Buffer.alloc(0), seq = 0; const pending = new Map();
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
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3c7', version: '1' } });
  await send('notifications/initialized', {});

  // 1) plan 发现必填参数（CreatePublicip 最小规格）
  const plan = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args: ['VPC', 'CreatePublicip', '--cli-region=cn-north-4'], allowWrites: false } });
  const pt = textOf(plan);
  console.log('INFO  plan(CreatePublicip):', pt.slice(0, 600).replace(/\n/g, ' '));
  check('D3-C7 plan 含 --cli-region=cn-north-4', /cli-region=cn-north-4/.test(pt));

  console.log('\n=== D3-C7 发现阶段汇总: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR:', e.message); child.kill(); process.exit(2); }
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 120000);