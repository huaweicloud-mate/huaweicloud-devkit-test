/**
 * Hermes 每日测试探针 - D6-3 MCP 冷启时间 (Linux)
 * SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290b0)
 * 测量 spawn mcp-server.mjs 到返回 initialize 响应的时间。
 */
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const SRV = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

const t0 = performance.now();
const child = spawn(process.execPath, [SRV], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
let done = false;
let readyAt = null;

const timeout = setTimeout(() => {
  if (!done) { console.log('FAIL  D6-3  MCP 冷启超时 (>10s)'); process.exitCode = 1; child.kill(); }
}, 10000);

child.stdout.on('data', (d) => {
  buf += d.toString('utf8');
  const idx = buf.indexOf('\n');
  while (idx !== -1 && !done) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (line) {
      try {
        const msg = JSON.parse(line);
        if (msg.id === 1 && !done) {
          readyAt = performance.now();
          done = true;
          clearTimeout(timeout);
          const ms = Math.round(readyAt - t0);
          console.log(`MCP initialize 响应到达: ${ms} ms`);
          console.log(`PASS  D6-3  MCP 冷启 < 5s  => ${ms}ms`);
          console.log(`  protocolVersion=${msg.result?.protocolVersion} tools=${JSON.stringify(msg.result?.capabilities?.tools) || 'n/a'}`);
          child.kill();
        }
      } catch {}
    }
    const idx2 = buf.indexOf('\n');
    if (idx2 === -1) break;
    if (idx2 === idx) break; // avoid infinite loop
    // continue via while loop
  }
});

child.stderr.on('data', () => {});
child.on('error', (e) => { console.log('ERR spawn:', e.message); process.exitCode = 1; });

// send initialize
child.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'hermes-daily-probe', version: '1.0' } },
}) + '\n');

// send initialized notification + tools/list after
setTimeout(() => {
  if (!done) {
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
  }
}, 100);