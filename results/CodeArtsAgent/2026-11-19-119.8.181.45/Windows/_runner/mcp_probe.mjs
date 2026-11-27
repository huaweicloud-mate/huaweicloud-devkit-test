import { spawn } from 'node:child_process';
const MCP = process.argv[2];
const msgs = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } },
  { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
];
function frame(o) { const j = JSON.stringify(o); return 'Content-Length: ' + Buffer.byteLength(j, 'utf8') + '\r\n\r\n' + j; }
const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let out = '', err = '';
p.stdout.on('data', d => { out += d.toString(); });
p.stderr.on('data', d => { err += d.toString(); });
let delay = 300;
for (const m of msgs) { setTimeout(() => { try { p.stdin.write(frame(m)); } catch {} }, delay); delay += 700; }
setTimeout(() => { try { p.stdin.end(); } catch {} }, delay + 800);
setTimeout(() => { try { p.kill(); } catch {} }, delay + 5000);
p.on('exit', () => {
  const parts = out.split(/Content-Length:\s*\d+\s*\r\n\r\n/).filter(Boolean);
  const parsed = [];
  for (const part of parts) { try { parsed.push(JSON.parse(part)); } catch {} }
  console.log(JSON.stringify({
    exit: p.exitCode,
    stderrHead: err.slice(0, 900),
    responseCount: parsed.length,
    ids: parsed.map(r => r.id),
    hasInit: parsed.some(r => r.id === 1 && r.result),
    toolCount: ((parsed.find(r => r.id === 2) || {}).result || {}).tools ? parsed.find(r => r.id === 2).result.tools.length : -1,
    protocolVersion: (parsed.find(r => r.id === 1) || {}).result ? parsed.find(r => r.id === 1).result.protocolVersion : null,
    toolsSample: (((parsed.find(r => r.id === 2) || {}).result || {}).tools || []).slice(0, 10).map(t => t.name),
    rawHead: out.slice(0, 500),
  }, null, 2));
});
