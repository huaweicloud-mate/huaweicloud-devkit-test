const { spawn } = require('child_process');
const MCP = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

class McpClient {
  constructor() {
    this.proc = null;
    this.buf = Buffer.alloc(0);
    this.waiters = new Map();
  }
  start() {
    this.proc = spawn('node', [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout.on('data', d => { this.buf = Buffer.concat([this.buf, d]); this._parse(); });
    this.proc.stderr.on('data', () => {});
  }
  _parse() {
    while (true) {
      const he = this.buf.indexOf('\r\n\r\n');
      if (he !== -1) {
        const hdr = this.buf.slice(0, he).toString('utf8');
        const m = hdr.match(/Content-Length:\s*(\d+)/i);
        if (!m) { this.buf = this.buf.slice(he + 4); continue; }
        const len = parseInt(m[1]);
        const total = he + 4 + len;
        if (this.buf.length < total) break;
        const body = this.buf.slice(he + 4, he + 4 + len).toString('utf8');
        this.buf = this.buf.slice(total);
        try { const r = JSON.parse(body); this._dispatch(r); } catch {}
        continue;
      }
      const lf = this.buf.indexOf('\n');
      if (lf !== -1) {
        const line = this.buf.slice(0, lf).toString('utf8').trim();
        this.buf = this.buf.slice(lf + 1);
        if (line) { try { this._dispatch(JSON.parse(line)); } catch {} }
        continue;
      }
      break;
    }
  }
  _dispatch(r) {
    const w = this.waiters.get(r.id);
    if (w) { this.waiters.delete(r.id); w(r); }
  }
  send(msg) {
    const json = JSON.stringify(msg);
    const frame = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
    this.proc.stdin.write(frame);
  }
  wait(id, timeout = 20000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.waiters.delete(id); reject(new Error(`Timeout id=${id}`)); }, timeout);
      this.waiters.set(id, (r) => { clearTimeout(t); resolve(r); });
    });
  }
  close() { try { this.proc.stdin.end(); } catch {} try { this.proc.kill(); } catch {} }
}

async function main() {
  const c = new McpClient();
  c.start();
  // init
  c.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
  const ir = await c.wait(1);
  console.log('INIT:', ir.result.serverInfo.name, ir.result.serverInfo.version);
  // tools/list
  c.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const lr = await c.wait(2);
  const tools = lr.result.tools;
  const names = tools.map(t => t.name);
  const unique = [...new Set(names)];
  const allSchema = tools.every(t => t.inputSchema && t.description && t.name);
  console.log('TOOLS:', tools.length, 'unique:', unique.length, 'schema:', allSchema);
  console.log('D9-1:', tools.length === 40 && unique.length === 40 && allSchema ? 'PASS' : 'FAIL');
  c.close();
  setTimeout(() => process.exit(0), 200);
}
main().catch(e => { console.error(e); process.exit(1); });
