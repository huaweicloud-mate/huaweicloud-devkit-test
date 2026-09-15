#!/usr/bin/env node
// D9-2 真机 stdio 层探针：向 MCP server 发未知方法，读回 error.code。
import { spawn } from 'node:child_process';

const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const child = spawn(process.execPath, [SRC], { stdio: ['pipe', 'pipe', 'inherit'] });

const reqs = [
  { jsonrpc: '2.0', id: 1, method: 'bogus/method', params: {} },
];
let out = '';
child.stdout.on('data', (d) => { out += d.toString(); });

function send(obj) {
  const body = JSON.stringify(obj);
  // 新行分隔（非 Content-Length framing 也可被 server 自适配）
  child.stdin.write(body + '\n');
}

child.on('error', (e) => { console.log('FAIL  D9-2  spawn error: ' + e.message); process.exit(1); });

// 先握手 initialize（server 在 readFrames 对新行分隔直接 JSON.parse）
setTimeout(() => { send(reqs[0]); }, 300);
setTimeout(() => {
  child.kill();
  console.log('@@CASE D9-2@@');
  // 解析响应行
  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
  const resp = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((o) => o && o.error);
  if (resp && resp.error) {
    console.log(`D9-2  未知方法 bogus/method => server 层 error.code = ${resp.error.code}，message = ${resp.error.message}`);
    console.log(`判定：${resp.error.code === -32601 ? 'PASS' : 'FAIL'}（MCP/JSON-RPC 规范要求 Method not found = -32601）`);
  } else {
    console.log('D9-2  未捕获到 error 响应，raw=' + JSON.stringify(out.slice(0, 400)));
  }
  console.log('@@END@@');
  process.exit(0);
}, 2500);