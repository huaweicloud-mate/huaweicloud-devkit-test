// Shared MCP stdio client helper for the v2mig2 performance probes.
// v2 speaks LSP-style Content-Length frames (and newline JSON); we use frames.
import { spawn } from 'node:child_process';

export function makeServer(serverPath, envExtra = {}) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', ...envExtra },
  });
  let buf = Buffer.alloc(0);
  let stderrBuf = '';
  const pending = new Map();
  let _id = 1;

  child.stderr.on('data', (d) => { stderrBuf += d.toString(); });

  function frame(obj) {
    const b = JSON.stringify(obj);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  }

  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try {
        const msg = JSON.parse(body);
        if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      } catch { /* ignore non-JSON noise */ }
    }
  });

  function send(obj, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { pending.delete(obj.id); reject(new Error(`timeout waiting id=${obj.id}`)); }, timeoutMs);
      pending.set(obj.id, (msg) => { clearTimeout(t); resolve(msg); });
      frame(obj);
    });
  }

  return {
    child,
    stderr: () => stderrBuf,
    nextId: () => _id++,
    send,
    async initialize() {
      const id = _id++;
      const r = await send({ jsonrpc: '2.0', id, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'v2mig2-probe', version: '1.0.0' } } });
      frame({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
      return r;
    },
    async call(name, args, timeoutMs = 30000) {
      const id = _id++;
      const r = await send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }, timeoutMs);
      return r;
    },
    kill() { try { child.kill(); } catch { /* noop */ } },
  };
}

export function p95(samples) {
  const s = [...samples].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1);
  return s[idx];
}

export function stats(samples) {
  const s = [...samples].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    min: +s[0].toFixed(2),
    max: +s[s.length - 1].toFixed(2),
    mean: +(sum / s.length).toFixed(2),
    p50: +s[Math.min(s.length - 1, Math.ceil(0.5 * s.length) - 1)].toFixed(2),
    p95: +p95(s).toFixed(2),
  };
}
