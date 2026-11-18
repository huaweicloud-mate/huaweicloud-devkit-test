// run-eval-local.mjs：D10-3 路由评测 harness（本地适配 v2 vendor 门禁的副本）
// 与 eval/harness/run-eval.mjs 等价，但：① service_catalog 调用带 vendorConfirmed
// ② 进程内 HUAWEICLOUD_VENDOR_CHALLENGE=off ③ 用绝对路径读 eval-set-v1.csv。
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const serverPath = process.argv[2];
const CSV = process.argv[3];
if (!serverPath || !CSV) { console.error('用法: node run-eval-local.mjs <server> <csv>'); process.exit(2); }

const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};

function makeServer(sp) {
  const child = spawn(process.execPath, [sp], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', HUAWEICLOUD_VENDOR_CHALLENGE: 'off' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

const raw = readFileSync(CSV, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const v = l.split(',');
  const o = {};
  header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim()));
  return o;
});

const srv = makeServer(serverPath);
await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'run-eval', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const VC = '用户明确要求使用华为云';
const results = [];
for (const r of rows) {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: r.prompt, vendorConfirmed: VC });
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {};
  try { rr = text ? JSON.parse(text) : {}; } catch { rr = {}; }
  const svcs = rr.recommendedServices || [];
  const expect = EXPECT[r.id];
  let verdict;
  if (expect === null) { verdict = 'N/A'; }
  else { verdict = expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS'; }
  results.push({ id: r.id, expect: (expect || []).join('/') || '(诊断)', got: svcs.join('+'), verdict });
  console.log(`${r.id} | ${verdict.padEnd(5)} | ${(expect || []).join('/') || '(诊断)'} | ${svcs.join('+') || '(空)'}`);
}
const hit = results.filter((r) => r.verdict === 'HIT').length;
const miss = results.filter((r) => r.verdict === 'MISS').length;
const na = results.filter((r) => r.verdict === 'N/A').length;
console.log(`HIT=${hit} MISS=${miss} N/A=${na}`);
srv.kill();