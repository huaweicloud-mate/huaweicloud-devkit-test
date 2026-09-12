#!/usr/bin/env node
// D3-C5 工具冒烟：39 工具逐一 tools/call（空/最小参数），验证均有 JSON-RPC 响应不崩溃
import { spawn } from 'node:child_process';
const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
let pass = 0, fail = 0; const failedTools = [];
function check(n, c, d = '') { if (c) { pass++; } else { fail++; failedTools.push(n + (d ? ' | ' + d : '')); console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }
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
let exited = false; child.on('exit', (c) => { exited = true; });
const textOf = (r) => (r.result?.content || []).map((x) => x.text || '').join('');

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3c5', version: '1' } });
  await send('notifications/initialized', {});
  const tl = await send('tools/list', {});
  const tools = tl.result?.tools || [];
  check('tools/list 返回 39 工具', tools.length === 39, `实际 ${tools.length}`);

  // 逐一冒烟：发空参数，验证有 JSON-RPC 响应（result 或 error），进程不崩溃
  for (const t of tools) {
    const r = await send('tools/call', { name: t.name, arguments: {} });
    const hasResult = r.result !== undefined && r.result !== null && !r.result.isError;
    const hasError = r.result?.isError === true || r.error !== undefined;
    check(`冒烟 ${t.name}`, hasResult || hasError, `响应=${hasResult ? 'result' : hasError ? 'error' : '异常'}`);
    if (exited) { console.log(`   进程在 ${t.name} 后崩溃`); break; }
  }

  console.log(`\n=== D3-C5 工具冒烟汇总: ${pass} PASS / ${fail} FAIL / ${tools.length} 工具 ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); child.kill(); process.exit(2); }
setTimeout(() => { child.kill(); process.exit(3); }, 180000);