// D9 协议 stdio 传输层探针 — 直接 spawn mcp-server.mjs over stdin/stdout
import { spawn } from 'node:child_process';

const SERVER = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = Buffer.alloc(0);
const pending = new Map();
let nextId = 1;

child.stdout.on('data', (c) => {
  buf = Buffer.concat([buf, c]);
  // parse Content-Length frames
  while (true) {
    const h = buf.indexOf('\r\n\r\n');
    if (h === -1) break;
    const header = buf.subarray(0, h).toString();
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) { buf = Buffer.alloc(0); break; }
    const len = Number(m[1]);
    const end = h + 4 + len;
    if (buf.length < end) break;
    const body = buf.subarray(h + 4, end).toString();
    buf = buf.subarray(end);
    const msg = JSON.parse(body);
    if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  }
});

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
    pending.set(id, resolve);
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('timeout ' + method)); } }, 15000);
  });
}

function cond(ok, label, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail || ''}`); return ok; }

child.stderr.on('data', () => {}); // swallow prewarm debug

// D9-4/D9-7 lifecycle + version
const init = await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes' } });
cond(init?.result?.serverInfo?.name === 'huaweicloud-devkit', 'D9-4 initialize', `server=${init?.result?.serverInfo?.name} v${init?.result?.serverInfo?.version}`);
cond(init?.result?.protocolVersion === '2024-11-05', 'D9-7 协商版本回显', `protocol=${init?.result?.protocolVersion}`);

// D9-1/D5-3 tools/list → 40 (= TOOL_DEFINITIONS.length)
const list = await rpc('tools/list', {});
cond(Array.isArray(list?.result?.tools) && list?.result?.tools.length === 40, 'D9-1/D5-3 tools/list=40', `count=${list?.result?.tools?.length}`);

// D9-3 tools/call 响应格式
const call = await rpc('tools/call', { name: 'huaweicloud_list_regions', arguments: {} });
const c = call?.result;
cond(c && Array.isArray(c.content) && c.content[0]?.type === 'text' && typeof c.content[0]?.text === 'string' && c.isError === false, 'D9-3 tools/call 格式', `content[0].type=${c?.content?.[0]?.type}, isError=${c?.isError}`);

// D9-2 未知方法错误码
const unknown = await rpc('unknown/method', {});
cond(unknown?.error?.code !== undefined, 'D9-2 未知方法返回 JSON-RPC error', `code=${unknown?.error?.code} msg=${unknown?.error?.message}`);

// D9-2 契约核对：JSON-RPC 2.0 规定 -32601 Method not found
cond(unknown?.error?.code === -32601, 'D9-2 错误码应为 -32601', `实际 ${unknown?.error?.code} ${unknown?.error?.code === -32601 ? '' : '→ SPEC-MISMATCH（实现用 -32603 Internal error）'}`);

// D9-8 inputSchema 版本合规
const t0 = list?.result?.tools?.[0];
cond(t0 && typeof t0.inputSchema === 'object' && t0.inputSchema.type === 'object', 'D9-8 inputSchema object', `tool0=${t0?.name} type=${t0?.inputSchema?.type}`);

child.stdin.end();
try { child.kill(); } catch {}
console.log('\nDONE');