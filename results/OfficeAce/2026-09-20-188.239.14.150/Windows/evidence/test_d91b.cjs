const { spawn } = require('child_process');
const MCP = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const p = spawn('node', [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
let msgCount = 0;
p.stdout.on('data', d => {
  buf += d.toString();
  console.log('DATA len=' + d.length + ' buf_len=' + buf.length);
  // Loop to process all complete messages
  while (true) {
    const he = buf.indexOf('\r\n\r\n');
    if (he === -1) {
      // Try line-delimited
      const lf = buf.indexOf('\n');
      if (lf !== -1) {
        const line = buf.slice(0, lf).trim();
        buf = buf.slice(lf + 1);
        if (line) {
          try {
            const r = JSON.parse(line);
            console.log('LINE MSG id=' + r.id);
            handleMsg(r);
          } catch {}
        }
        continue;
      }
      break;
    }
    const m = buf.slice(0, he).match(/Content-Length:\s*(\d+)/i);
    if (!m) { buf = buf.slice(he + 4); continue; }
    const len = parseInt(m[1]);
    const total = he + 4 + len;
    if (buf.length < total) {
      console.log('WAITING for ' + total + ' have ' + buf.length);
      break;
    }
    const body = buf.slice(he + 4, total);
    buf = buf.slice(total);
    try {
      const r = JSON.parse(body);
      console.log('CL MSG id=' + r.id);
      handleMsg(r);
    } catch (e) { console.log('PARSE ERR:', e.message); }
  }
});

function handleMsg(r) {
  msgCount++;
  if (r.id === 1) {
    console.log('INIT OK:', r.result.serverInfo.name, r.result.serverInfo.version);
    const m2 = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    p.stdin.write('Content-Length: ' + Buffer.byteLength(m2) + '\r\n\r\n' + m2);
    console.log('Sent tools/list');
  }
  if (r.id === 2) {
    const tools = r.result.tools;
    console.log('TOOLS:', tools.length);
    console.log('D9-1: PASS');
    p.kill();
    setTimeout(() => process.exit(0), 200);
  }
}

p.stderr.on('data', d => console.error('STDERR:', d.toString()));
const msg = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
p.stdin.write('Content-Length: ' + Buffer.byteLength(msg) + '\r\n\r\n' + msg);
console.log('Sent init');
setTimeout(() => { console.log('TIMEOUT buf=' + buf.length); p.kill(); process.exit(1); }, 10000);
