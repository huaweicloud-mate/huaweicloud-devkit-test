#!/usr/bin/env node
// D9 协议健壮：D9-7 版本协商 / D9-8 inputSchema 合规 / D9-5 分片传输 / D9-9 超时语义
import { spawn } from 'node:child_process';
const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }

// D9-5 分片传输 + D9-7 版本协商：连续 socket 送入一个拆成多片的消息
const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0), seq = 0; const pending = new Map();
function sendRaw(chunks) { const id = ++seq; return { id, chunks }; }
function rawFrame(id, method, params = {}) { const m = JSON.stringify({ jsonrpc: '2.0', id, method, params }); return `Content-Length: ${Buffer.byteLength(m)}\r\n\r\n${m}`; }
async function fragmentedSend(id, method, params = {}) {
  const frame = rawFrame(id, method, params);
  // 拆成 3 字节一片
  for (let i = 0; i < frame.length; i += 3) child.stdin.write(frame.slice(i, i + 3));
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
  // D9-5 分片传输：initialize 拆片发送
  const init = await fragmentedSend(1, 'initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd9', version: '1' } });
  check('D9-5 分片传输 initialize 正确解析', init.result?.serverInfo?.name === 'huaweicloud-devkit', init.result?.serverInfo?.name || JSON.stringify(init).slice(0, 60));

  // D9-7 版本协商：客户端声明未来版本
  const verNeg = await fragmentedSend(2, 'initialize', { protocolVersion: '2099-99-99', clientInfo: { name: 'd9', version: '1' } });
  check('D9-7 未来版本协议仍能 initialize（不崩溃）', verNeg.result?.serverInfo?.name === 'huaweicloud-devkit' || verNeg.error !== undefined, JSON.stringify(verNeg).slice(0, 80));

  // D9-8 inputSchema 合规：tools/list 后校验每个 inputSchema
  const tl = await fragmentedSend(3, 'tools/list', {});
  const tools = tl.result?.tools || [];
  const schemaOk = tools.every((t) => t.inputSchema && t.inputSchema.type === 'object' && typeof t.description === 'string' && t.description.length > 0);
  check('D9-8 39 工具 inputSchema 合规(type=object+description)', tools.length === 39 && schemaOk, `tools=${tools.length}`);

  console.log(`\n=== D9 协议健壮汇总: ${pass} PASS / ${fail} FAIL ===`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); process.exit(2); }
setTimeout(() => { process.exit(3); }, 60000);