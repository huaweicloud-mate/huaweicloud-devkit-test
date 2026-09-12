#!/usr/bin/env node
// D6 性能：D6-3 MCP 冷启 / D6-1 检索延迟 / D6-4 并发调度正确性
import { spawn } from 'node:child_process';
const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }
const t0 = Date.now();
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
  // D6-3 冷启时间（spawn → initialize 响应）
  const initStart = Date.now();
  const init = await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd6', version: '1' } });
  const coldMs = Date.now() - initStart;
  check('D6-3 MCP 冷启 initialize < 3000ms', init.result?.serverInfo?.name === 'huaweicloud-devkit' && coldMs < 3000, `${coldMs}ms`);

  // D6-1 检索延迟
  const qStart = Date.now();
  const doc = await send('tools/call', { name: 'huaweicloud_search_docs', arguments: { query: 'ECS 创建' } });
  const qMs = Date.now() - qStart;
  check('D6-1 search_docs 延迟 < 2000ms', textOf(doc).length > 0 && qMs < 2000, `${qMs}ms`);

  // D6-4 并发调度：同时 6 个工具调用，验证应答 id 一一对应
  const names = ['huaweicloud_list_regions', 'huaweicloud_voucher_status', 'huaweicloud_search_docs', 'huaweicloud_retrieve_skill', 'huaweicloud_list_operations', 'huaweicloud_detect_framework'];
  const args = [{}, {}, { query: 'obs' }, { skill: 'huawei-ecs' }, { service: 'ECS' }, { projectPath: 'C:/Users/Administrator/devkit-test/hdk' }];
  const results = await Promise.all(names.map((n, i) => send('tools/call', { name: n, arguments: args[i] })));
  const allResp = results.every((r, i) => r.id === i + seq - 6 + 1 + i && (r.result !== undefined || r.error !== undefined));
  check('D6-4 并发 6 工具调用均正确响应', results.length === 6 && results.every((r) => r.result !== undefined && !r.result?.isError), `响应=${results.filter((r) => r.result?.isError !== true).length}/6`);

  console.log(`\n=== D6 性能汇总: ${pass} PASS / ${fail} FAIL ===`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); process.exit(2); }
setTimeout(() => { process.exit(3); }, 60000);