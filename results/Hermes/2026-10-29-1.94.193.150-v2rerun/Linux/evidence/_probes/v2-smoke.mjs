#!/usr/bin/env node
// v2 MCP smoke probe: verify dist/mcp-server.js starts, initializes, lists tools.
import { spawn } from 'node:child_process';

const MCP = process.argv[2] || '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist/mcp-server.js';

function frame(obj) {
  const json = JSON.stringify(obj);
  return `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
}

function run(messages, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    let done = false;
    const finish = () => { if (!done) { done = true; resolve({ out, err }); } };
    p.stdout.on('data', d => { out += d.toString(); });
    p.stderr.on('data', d => { err += d.toString(); });
    p.on('exit', finish);
    p.on('error', (e) => { err += 'SPAWN_ERR:' + e.message; finish(); });
    let delay = 300;
    for (const m of messages) {
      setTimeout(() => { try { p.stdin.write(frame(m)); } catch (e) {} }, delay);
      delay += 500;
    }
    setTimeout(() => { try { p.stdin.end(); } catch (e) {} }, delay + 2000);
    setTimeout(() => { try { p.kill(); } catch (e) {} finish(); }, timeoutMs);
  });
}

function parse(out) {
  const parts = out.split(/Content-Length:\s*\d+\s*\r\n\r\n/);
  const res = [];
  for (let i = 1; i < parts.length; i++) { try { res.push(JSON.parse(parts[i])); } catch (e) {} }
  return res;
}

const { out, err } = await run([
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } },
  { jsonrpc: '2.0', id: 2, method: 'notifications/initialized', params: {} },
  { jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} },
]);
const res = parse(out);
console.log('=== responses:', res.length);
for (const r of res) {
  if (r.id === 1) console.log('initialize result:', JSON.stringify(r.result && { protocolVersion: r.result.protocolVersion, serverInfo: r.result.serverInfo }));
  if (r.id === 3) {
    const tools = r.result && r.result.tools || [];
    console.log('tools/list count:', tools.length);
    console.log('tool names:', tools.map(t => t.name).join(', '));
  }
  if (r.error) console.log('ERROR', r.id, JSON.stringify(r.error));
}
console.log('=== stderr tail ===');
console.log(err.split('\n').slice(-8).join('\n'));