// probe-lib/_d9_9_client.mjs — D9-9 子进程夹具：以真实 JSON-RPC(LF) 帧驱动 huaweicloud-core MCP stdio 服务
// 用法: node _d9_9_client.mjs <hdk mcp-server.mjs 绝对路径> [挂起时长ms]
// 输出: 单行 JSON {frames:[...], elapsedMs, stderr}
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
const holdMs = Number(process.argv[3] || 6000);
const srv = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1' },
});

const frames = [];
let stderr = '';
srv.stderr.on('data', (c) => { stderr += c.toString(); });

// 请求一律 LF 分隔：服务端 readFrames 未见 CRLFCRLF → useContentLengthFraming=false
// → 响应亦为「JSON + \n」纯文本，逐行解析。
let buf = '';
srv.stdout.on('data', (chunk) => {
  buf += chunk.toString('utf8');
  let lf;
  while ((lf = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, lf).trim();
    buf = buf.slice(lf + 1);
    if (line) {
      if (line.startsWith('Content-Length:')) continue;
      try { frames.push(JSON.parse(line)); } catch { /* 非 JSON 行忽略 */ }
    }
  }
});

const send = (o) => srv.stdin.write(JSON.stringify(o) + '\n');
const t0 = Date.now();

send({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-9-probe', version: '1.0.0' } },
});
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
// 挂起型调用：客户端侧超时基线（不真正等待服务端完成）
send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: {} } });
// 非法工具名 → 观测 JSON-RPC 错误码语义（D9-2 交叉验证）
send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'huaweicloud_no_such_tool', arguments: {} } });

setTimeout(() => {
  console.log(JSON.stringify({ frames, elapsedMs: Date.now() - t0, stderr: stderr.slice(0, 400) }));
  srv.kill();
  process.exit(0);
}, holdMs);

srv.on('error', (e) => {
  console.log(JSON.stringify({ frames, spawnError: e.message, stderr: stderr.slice(0, 400) }));
  process.exit(1);
});
