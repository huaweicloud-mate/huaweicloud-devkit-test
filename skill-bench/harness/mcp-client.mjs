// mcp-client.mjs — devkit MCP stdio 客户端 + tools/list 转 OpenAI function-calling 格式
// 复用 run-eval.mjs 的 Content-Length 帧封装模式，抽出可复用的 API。
import { spawn } from 'node:child_process';

// 启动 MCP server（stdio），返回 { call, kill }
export function startMcpServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((resolve) => pending.set(o.id, resolve));
  }
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
      try {
        const msg = JSON.parse(body);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      } catch { /* 忽略无法解析的帧 */ }
    }
  });
  const call = (method, params) => send({ jsonrpc: '2.0', id: _id++, method, params });
  return { child, call, kill: () => { try { child.kill(); } catch {} } };
}

// 初始化 + 拉取工具清单
export async function listTools(srv) {
  await srv.call('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'skill-bench', version: '1.0.0' },
  });
  // notification 无 id，异步发即可
  srv.call('notifications/initialized');
  const resp = await srv.call('tools/list', {});
  return resp?.result?.tools || [];
}

// MCP 工具 -> OpenAI function-calling tools
export function toOpenAITools(tools) {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description || '',
      parameters: t.inputSchema || { type: 'object', properties: {} },
    },
  }));
}

// 从 tools/call 的响应里抽取文本结果
export function extractToolResult(resp) {
  const content = resp?.result?.content;
  if (Array.isArray(content)) {
    return content.map((c) => (c && c.type === 'text' ? c.text : JSON.stringify(c))).join('\n');
  }
  return JSON.stringify(resp?.result ?? resp ?? {});
}