import { spawn } from 'node:child_process';
import { join } from 'node:path';

// Measure cold start: spawn MCP server and send initialize, measure time to response
const start = Date.now();
const proc = spawn('node', [join('plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env }
});

let buffer = '';
proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.id === 1) {
        const elapsed = Date.now() - start;
        console.log(JSON.stringify({ cold_start_ms: elapsed, pass: elapsed < 3000 }));
        proc.kill();
        process.exit(0);
      }
    } catch {}
  }
});

// Send initialize after a short delay
setTimeout(() => {
  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } }
  }) + '\n');
}, 100);

// Timeout after 5s
setTimeout(() => {
  console.log(JSON.stringify({ cold_start_ms: -1, pass: false, error: 'timeout' }));
  proc.kill();
  process.exit(1);
}, 5000);
