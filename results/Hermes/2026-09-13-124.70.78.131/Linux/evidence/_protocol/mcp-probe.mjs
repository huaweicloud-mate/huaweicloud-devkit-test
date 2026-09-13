// MCP 协议探针（D9）：驱动 huaweicloud-devkit-mcp 服务器，验证 JSON-RPC 生命周期
// 用法: node mcp-probe.mjs [mcp-server-path]
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2] || process.env.MCP_SERVER;
if (!serverPath) {
  console.error('用法: node mcp-probe.mjs <mcp-server.mjs 路径>');
  process.exit(2);
}

const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});

let buf = Buffer.alloc(0);
const pending = new Map();
let stderrBuf = '';

child.stderr.on('data', (d) => { stderrBuf += d.toString(); });
child.on('exit', (code) => {
  console.log(`[server exited code=${code}]`);
  if (stderrBuf.trim()) console.log('=== server stderr ===\n' + stderrBuf.trim().slice(0, 2000));
});

function send(obj) {
  const body = JSON.stringify(obj);
  const frame = Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  child.stdin.write(frame);
  return new Promise((resolve) => {
    pending.set(obj.id, resolve);
  });
}

let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  const p = send({ jsonrpc: '2.0', id, method, params });
  return { id, p };
}

child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const headerEnd = buf.indexOf('\r\n\r\n');
    if (headerEnd < 0) break;
    const header = buf.slice(0, headerEnd).toString();
    const m = /Content-Length:\s*(\d+)/i.exec(header);
    if (!m) { buf = buf.slice(headerEnd + 4); continue; }
    const len = parseInt(m[1], 10);
    if (buf.length < headerEnd + 4 + len) break; // incomplete frame
    const body = buf.slice(headerEnd + 4, headerEnd + 4 + len).toString();
    buf = buf.slice(headerEnd + 4 + len);
    try {
      const msg = JSON.parse(body);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else {
        console.log('[notification]', JSON.stringify(msg).slice(0, 300));
      }
    } catch (e) { console.log('[bad json]', body.slice(0, 200)); }
  }
});

async function main() {
  const { p: initP } = rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'hermes-mcp-probe', version: '1.0.0' },
  });
  const initRes = await initP;
  console.log('=== initialize ===');
  console.log(JSON.stringify(initRes, null, 2).slice(0, 1500));

  // 发送 initialized 通知（协议要求）
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  const { p: listP } = rpc('tools/list', {});
  const listRes = await listP;
  console.log('\n=== tools/list ===');
  const tools = listRes?.result?.tools || [];
  console.log(`tool count = ${tools.length}`);
  console.log('tool names:', tools.map(t => t.name).join(', '));
  // 校验每个工具是合法 JSON Schema
  let badSchema = 0;
  for (const t of tools) {
    if (!t || typeof t.name !== 'string' || !t.inputSchema || typeof t.inputSchema !== 'object') {
      badSchema++;
      console.log('  BAD SCHEMA:', JSON.stringify(t).slice(0, 150));
    }
    // 检查 inputSchema.type
    if (t.inputSchema && t.inputSchema.type !== 'object') {
      badSchema++;
      console.log(`  inputSchema.type != object: ${t.name} -> ${t.inputSchema.type}`);
    }
  }
  console.log(`bad schema count = ${badSchema}`);

  // tools/call：成功路径（取第一个工具，若需要参数则给空对象）
  if (tools.length > 0) {
    const first = tools[0];
    console.log(`\n=== tools/call: ${first.name} ===`);
    const { p: callP } = rpc('tools/call', { name: first.name, arguments: {} });
    const callRes = await callP;
    console.log(JSON.stringify(callRes, null, 2).slice(0, 1200));
    const content = callRes?.result?.content;
    const isError = callRes?.result?.isError;
    console.log(`content type = ${Array.isArray(content) ? 'array(' + content.length + ')' : typeof content}; isError = ${isError}`);
  }

  // tools/call：失败路径（未知工具）
  console.log('\n=== tools/call: 未知工具 (错误语义) ===');
  const { p: badP } = rpc('tools/call', { name: '__no_such_tool__', arguments: {} });
  const badRes = await badP;
  console.log(JSON.stringify(badRes, null, 2).slice(0, 800));

  // 非法时序：未 initialize 直接 tools/list 应在独立进程测试（此处略）
  console.log('\n=== DONE ===');
  child.kill();
  process.exit(0);
}

setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 30000);
main();