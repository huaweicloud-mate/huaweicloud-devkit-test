// D6-3 MCP 冷启时间 —— 冷启 MCP server 到可服务(initialize 响应) < 5s
// 每次全新 spawn 进程（真冷启），采样 N 次，p95 判据。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { stats } from './mcp-client.mjs';

const SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const MCP = join(SRC, 'mcp-server.js');
const THRESHOLD_MS = 5000;
const N = Number(process.env.D6_3_SAMPLES || 5);

function coldStartOnce() {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const child = spawn(process.execPath, [MCP], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
    });
    let buf = Buffer.alloc(0);
    let settled = false;
    const finish = (ms, info) => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch { /* noop */ }
      resolve({ ms, ...info });
    };
    const timer = setTimeout(() => finish(null, { error: 'timeout >15s' }), 15000);
    child.stderr.on('data', () => {});
    child.on('error', (e) => { clearTimeout(timer); finish(null, { error: String(e) }); });
    child.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) return;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) return;
      const n = +m[1];
      if (buf.length < h + 4 + n) return;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      clearTimeout(timer);
      let serverInfo;
      try { serverInfo = JSON.parse(body)?.result?.serverInfo; } catch { /* noop */ }
      finish(+(performance.now() - t0).toFixed(2), { serverInfo });
    });
    const body = JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'v2mig2-cold', version: '1.0.0' } },
    });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`));
  });
}

const out = {
  caseId: 'D6-3',
  title: `MCP 冷启时间 (${N} 次真冷启采样, p95<5s)`,
  threshold: 'p95 < 5000ms',
  env: { HDK_SRC: SRC, node: process.version },
  startedAt: new Date().toISOString(),
};
const samples = [];
const errors = [];
for (let i = 0; i < N; i += 1) {
  const r = await coldStartOnce();
  if (r.ms === null) errors.push(r.error || 'unknown');
  else { samples.push(r.ms); out.serverInfo = out.serverInfo || r.serverInfo; }
}
out.samples = samples;
out.errors = errors;
out.stats = samples.length ? stats(samples) : null;
out.verdict = samples.length === N && out.stats.p95 < THRESHOLD_MS ? 'PASS' : 'FAIL';
out.assertion = `cold-start p95=${out.stats ? out.stats.p95 : 'n/a'}ms ${out.stats && out.stats.p95 < THRESHOLD_MS ? '<' : '>='} ${THRESHOLD_MS}ms (samples=${samples.join(',')}ms)`;
out.finishedAt = new Date().toISOString();

const text = JSON.stringify(out, null, 2);
console.log(text);
if (process.env.HDK_EVIDENCE) {
  const d = join(process.env.HDK_EVIDENCE, 'D6-3');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), text, 'utf8');
}
process.exit(out.verdict === 'PASS' ? 0 : 1);
