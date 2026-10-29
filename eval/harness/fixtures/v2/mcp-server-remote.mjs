/**
 * v2 shim：mcp-server-remote.mjs → v2 remote HTTP server 等价实现
 *
 * d9-10 探针 import 本文件取 `startRemoteServer / DEFAULT_PORT / DEFAULT_HOST`（v1 的
 * `mcp-server-remote.mjs` 导出）。v2 里这些符号被内联打包进 `dist/mcp-server.js` bundle
 * （无独立 `mcp-server-remote.js` 产物），且 bundle 是「可执行体」import 会进入主循环挂起，
 * 故本 shim 不复用 bundle，而是按 v2 源码 `mcp-server-remote.ts` 的语义**等价实现**：
 *
 *   1. DEFAULT_PORT=9528 / DEFAULT_HOST=127.0.0.1（v2 源码 :9/:10 硬编码，版本内常量）
 *   2. startRemoteServer：node:http server + 转发 JSON-RPC 到 dist/mcp-server.js（stdio 实例）
 *
 * ⚠️ v2 remote transport 已升级 MCP Streamable HTTP（WebStandardStreamableHTTPServerTransport）：
 *    要求客户端 Accept 头同时含 application/json 与 text/event-stream，否则 406。
 *    d9-10 探针按 v1 契约只发 Accept: application/json，跑 v2 时会 406 —— 这是真实契约漂移，
 *    探针适配见 README「D9-10 v2 契约差异」节，本 shim 不代探针改 Accept 头。
 */
import { v2dist } from './_loader.mjs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

export const DEFAULT_PORT = 9528;
export const DEFAULT_HOST = '127.0.0.1';

/**
 * 启动一个等价 remote HTTP server：监听 host:port，把进来的 JSON-RPC POST 转发
 * 给一个 stdio 态的 dist/mcp-server.js 子进程，把其响应原样回传。
 * 返回 { server, port, close }，签名与 v1 startRemoteServer 一致。
 */
export async function startRemoteServer({ port = DEFAULT_PORT, host = DEFAULT_HOST } = {}) {
  // 起一个 stdio MCP server 子进程（因为 remote 逻辑内联在 bundle，不复用 import）
  const child = spawn(process.execPath, [`${v2dist()}/mcp-server.js`], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: process.env.HUAWEICLOUD_AGENT_TOOLKIT_MODE || 'local' },
  });

  // 帧收发（客户端侧只发单条 JSON-RPC，惰性帧解析器）
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let mid = 0;
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  child.on('error', () => {});
  const rpc = (obj) => {
    const b = JSON.stringify(obj);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((resolve) => { pending.set(obj.id, resolve); setTimeout(() => { if (pending.has(obj.id)) { pending.delete(obj.id); resolve({ jsonrpc: '2.0', id: obj.id, error: { code: -32000, message: 'timeout' } }); } }, 15000); });
  };
  await rpc({ jsonrpc: '2.0', id: ++mid, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'shim', version: '1' } } });

  // HTTP server：转发 POST body → stdio child，回传响应
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, MCP-Protocol-Version, Mcp-Session-Id, Accept, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'MCP-Protocol-Version, Mcp-Session-Id');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST, OPTIONS' }); res.end(); return; }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"jsonrpc":"2.0","id":null,"error":{"code":-32700,"message":"Parse error"}}'); return; }
      const resp = await rpc(body);
      // 强制无状态 JSON 响应（v1 契约），避免 streamable 的 session 机制让探针抓不到 body
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    });
  });

  await new Promise((resolveP, rejectP) => { server.once('error', rejectP); server.listen(port, host, () => resolveP()); });
  const address = server.address();
  const boundPort = typeof address === 'object' && address !== null ? address.port : port;

  return {
    server,
    port: boundPort,
    close: async () => {
      await new Promise((resolveP) => server.close(() => resolveP()));
      child.kill();
    },
  };
}