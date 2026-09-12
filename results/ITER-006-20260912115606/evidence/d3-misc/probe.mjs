#!/usr/bin/env node
// D3-B4 explain_error / D3-B6 search_docs / D3-A4 区域意图 + list_operations
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
const textOf = (r) => (r.result?.content || []).map((x) => x.text || '').join('');
async function tool(name, args) { const r = await send('tools/call', { name, arguments: args }); return { text: textOf(r), isErr: r.result?.isError === true, err: r.error }; }

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3b', version: '1' } });
  await send('notifications/initialized', {});

  // D3-B4 explain_error：常见错误码解释
  let r = await tool('huaweicloud_explain_error', { code: 'APIGW.0101' });
  check('D3-B4 explain_error(APIGW.0101) 返回解释', !r.isErr && r.text.length > 30, r.text.slice(0, 90).replace(/\n/g, ' '));
  r = await tool('huaweicloud_explain_error', { code: 'NOT_EXIST_XYZ' });
  check('D3-B4 explain_error(未知码) 有可执行回退', !r.isErr && r.text.length > 0, r.text.slice(0, 70).replace(/\n/g, ' '));

  // D3-B6 search_docs：查询命中
  r = await tool('huaweicloud_search_docs', { query: '创建 ECS 云服务器' });
  check('D3-B6 search_docs(ECS) 返回结果', !r.isErr && r.text.length > 30, r.text.slice(0, 90).replace(/\n/g, ' '));
  r = await tool('huaweicloud_search_docs', { query: 'OBS 桶 创建 权限' });
  check('D3-B6 search_docs(OBS) 返回结果', !r.isErr && r.text.length > 30, r.text.slice(0, 90).replace(/\n/g, ' '));

  // D3-A4 区域意图 + 元数据
  r = await tool('huaweicloud_list_regions', {});
  check('D3-A4 list_regions 返回区域列表', !r.isErr && /cn-north-4|cn-/.test(r.text), r.text.slice(0, 80).replace(/\n/g, ' '));

  // D3-C7 跨区域：list_operations 带区域维度
  r = await tool('huaweicloud_list_operations', { service: 'EVS' });
  check('D3-C7 list_operations(EVS) 返回操作', !r.isErr && r.text.length > 0, r.text.slice(0, 70).replace(/\n/g, ' '));

  console.log(`\n=== D3-B4/B6/A4/C7 汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); child.kill(); process.exit(2); }
setTimeout(() => { child.kill(); process.exit(3); }, 120000);