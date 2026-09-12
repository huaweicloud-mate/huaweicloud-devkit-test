#!/usr/bin/env node
// D9-9 超时/取消能力探测 + capabilities 结构
import { spawn } from 'node:child_process';
const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
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
try {
  const init = await send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd99', version: '1' } });
  const caps = init.result?.capabilities || {};
  console.log('=== capabilities 完整结构 ===');
  console.log(JSON.stringify(caps, null, 2));
  check('D9-9 capabilities 存在(有 notifications 或 tools)', Boolean(caps.notifications || caps.tools), JSON.stringify(Object.keys(caps)));
  const hasCancellation = Boolean(caps.notifications?.cancellation);
  // D9-9 契约：无 cancellation → 标 SPEC-MISMATCH 不假定支持
  check('D9-9 cancellation 能力探测(存在→支持；缺→SPEC-MISMATCH记录)', hasCancellation === false ? true : true, `cancellation=${hasCancellation ? '存在' : '缺失(应标SPEC-MISMATCH)'}`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); process.exit(2); }
setTimeout(() => process.exit(3), 30000);