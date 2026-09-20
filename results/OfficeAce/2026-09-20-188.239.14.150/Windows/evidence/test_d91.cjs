const { spawn } = require('child_process');
const MCP = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const p = spawn('node', [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
p.stdout.on('data', d => {
  buf += d.toString();
  const he = buf.indexOf('\r\n\r\n');
  if (he !== -1) {
    const m = buf.slice(0, he).match(/Content-Length:\s*(\d+)/i);
    if (m) {
      const len = parseInt(m[1]);
      const total = he + 4 + len;
      if (buf.length >= total) {
        const body = buf.slice(he + 4, total);
        buf = buf.slice(total);
        try {
          const r = JSON.parse(body);
          if (r.id === 1) {
            console.log('INIT OK:', r.result.serverInfo.name, r.result.serverInfo.version);
            const m2 = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
            p.stdin.write('Content-Length: ' + Buffer.byteLength(m2) + '\r\n\r\n' + m2);
          }
          if (r.id === 2) {
            const tools = r.result.tools;
            const names = tools.map(t => t.name);
            const unique = [...new Set(names)];
            const allSchema = tools.every(t => t.inputSchema && t.description && t.name);
            console.log('TOOLS:', tools.length, 'unique:', unique.length, 'schema:', allSchema);
            console.log('D9-1:', tools.length === 40 && unique.length === 40 && allSchema ? 'PASS' : 'FAIL');
            p.kill();
            setTimeout(() => process.exit(0), 200);
          }
        } catch (e) { console.log('PARSE ERR:', e.message); }
      }
    }
  }
});
p.stderr.on('data', d => console.error('ERR:', d.toString()));
const msg = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
p.stdin.write('Content-Length: ' + Buffer.byteLength(msg) + '\r\n\r\n' + msg);
setTimeout(() => { console.log('TIMEOUT'); p.kill(); process.exit(1); }, 10000);
