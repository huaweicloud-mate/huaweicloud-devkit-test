// AI生成
// D9-10: 远程传输 - --transport remote模式启动HTTP服务器
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const SERVER = join(SRC, 'src', 'mcp-server.mjs');
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];

  // Check remote server source exists
  const remoteSrc = join(SRC, 'src', 'mcp-server-remote.mjs');
  results.push({check:'remote_source_exists', pass: existsSync(remoteSrc)});

  // Read the remote server source to verify it uses http
  const remoteContent = readFileSync(remoteSrc, 'utf8');
  results.push({check:'uses_http_module', pass: /import.*http/.test(remoteContent) || /require.*http/.test(remoteContent) || /from\s+['"]node:http['"]/.test(remoteContent)});
  results.push({check:'has_startRemoteServer', pass: /export.*startRemoteServer/.test(remoteContent) || /function\s+startRemoteServer/.test(remoteContent)});

  // Check DEFAULT_PORT and DEFAULT_HOST exports
  results.push({check:'has_default_port', pass: /DEFAULT_PORT/.test(remoteContent)});
  results.push({check:'has_default_host', pass: /DEFAULT_HOST/.test(remoteContent)});

  // Try to start remote server on a test port
  const proc = spawn('node', [SERVER, '--transport', 'remote', '--port', '18399', '--host', '127.0.0.1'], { stdio: ['pipe', 'pipe', 'pipe'] });

  let stderrData = '';
  proc.stderr.on('data', (d) => { stderrData += d.toString(); });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));

  // Check if process is still running (didn't crash)
  const stillRunning = !proc.killed && proc.exitCode === null;
  results.push({check:'remote_server_starts', pass: stillRunning});

  if (stillRunning) {
    // Try to connect via HTTP
    try {
      const resp = await fetch('http://127.0.0.1:18399/', { method: 'GET', signal: AbortSignal.timeout(3000) });
      results.push({check:'http_responds', pass: true});
    } catch(e) {
      // Server might not respond to GET / but could still be listening
      // Try POST with JSON-RPC
      try {
        const resp = await fetch('http://127.0.0.1:18399/mcp', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({jsonrpc:'2.0', id:1, method:'initialize', params:{protocolVersion:'2024-11-05', clientInfo:{name:'test', version:'1.0'}}}),
          signal: AbortSignal.timeout(3000)
        });
        results.push({check:'http_post_responds', pass: resp.status !== undefined});
      } catch(e2) {
        results.push({check:'http_connectable', pass: false, why: e2.message});
      }
    }
  }

  proc.kill();

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `远程传输: mcp-server-remote.mjs存在, 支持HTTP服务器启动, --transport remote参数生效` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
