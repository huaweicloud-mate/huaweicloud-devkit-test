// run-eval.mjs：D10-3 路由评测 harness（可复现）
// 读 ../prompts/eval-set-v1.csv，逐条调 huaweicloud_service_catalog(intent=prompt)，
// 对比期望路由，输出 results/eval-run-<YYYYMMDDHHmmss>.csv + 控制台汇总。
// 用法: node run-eval.mjs <mcp-server.mjs 路径>
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2];
if (!serverPath) {
  console.error('用法: node run-eval.mjs <mcp-server.mjs 路径>');
  process.exit(2);
}

// 期望路由映射（eval-set-v1.csv 期望路由 → serviceCatalog 返回的 service 精确名）
// E08 为诊断类（应走 explain_error 工具，不查服务目录）→ null 标记为 N/A
const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};

// ---- MCP JSON-RPC 帧封装（同 supplement-probe.mjs 模式）----
function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
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

// ---- 主流程 ----
const csvPath = join(__dirname, '..', 'prompts', 'eval-set-v1.csv');
const raw = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
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

const results = [];
for (const r of rows) {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: r.prompt });
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {};
  try { rr = text ? JSON.parse(text) : {}; } catch { rr = {}; }
  const svcs = rr.recommendedServices || [];
  const expect = EXPECT[r.id];
  let verdict;
  if (expect === null) {
    verdict = 'N/A';
  } else {
    verdict = expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
  }
  results.push({ id: r.id, prompt: r.prompt, expect: (expect || []).join('/') || '(诊断)', got: svcs.join('+'), verdict });
  console.log(`${r.id} | ${verdict.padEnd(5)} | 期望=${(expect || []).join('/') || '(诊断)'} | 实际=${svcs.join('+') || '(空)'} | ${r.prompt.slice(0, 24)}`);
}

const hit = results.filter((r) => r.verdict === 'HIT').length;
const miss = results.filter((r) => r.verdict === 'MISS').length;
const na = results.filter((r) => r.verdict === 'N/A').length;
const denom = hit + miss;
console.log(`\n=== 路由准确率基线 ===`);
console.log(`HIT=${hit} MISS=${miss} N/A=${na} | 准确率=${denom ? ((hit / denom) * 100).toFixed(1) : 'N/A'}% (分母=HIT+MISS=${denom})`);

// 写结果 CSV
const outDir = join(__dirname, '..', 'results');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const outPath = join(outDir, `eval-run-${ts}.csv`);
const csvOut = ['id,prompt,expectedServices,actualServices,verdict']
  .concat(results.map((r) => `"${r.id}","${r.prompt}","${r.expect}","${r.got.replace(/"/g, '""')}",${r.verdict}`))
  .join('\n') + '\n';
writeFileSync(outPath, csvOut, 'utf-8');
console.log(`结果落盘: ${outPath}`);

srv.kill();
process.exit(0);