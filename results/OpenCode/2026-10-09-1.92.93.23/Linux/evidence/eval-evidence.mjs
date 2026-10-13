// eval-evidence.mjs — D10-3 路由层评测：逐条调用 huaweicloud_service_catalog(intent)
// 对照 eval-set-v1.csv 期望路由，写 evidence/EXP-E##/stdout.log + probe.txt
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_BASE = __dirname;
const SERVER = '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const CSV = '/home/zhangshuang/devkit-test/OpenCode/huaweicloud-devkit-test/eval/prompts/eval-set-v1.csv';

const EXPECT = {
  'EXP-E01': 'ECS', 'EXP-E02': 'ECS', 'EXP-E03': 'OBS', 'EXP-E04': 'EIP',
  'EXP-E05': 'RDS', 'EXP-E06': 'DCS', 'EXP-E07': 'CBR', 'EXP-E08': null,
  'EXP-E09': 'CCE', 'EXP-E10': 'FunctionGraph', 'EXP-E11': 'BSS', 'EXP-E12': 'CES',
  'EXP-E13': 'ELB', 'EXP-E14': 'IAM', 'EXP-E15': 'Incentive Voucher',
};

const now = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

function makeServer() {
  const child = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0);
  const pending = new Map(); let _id = 1;
  const send = (o) => { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); };
  child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); while (true) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; } const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n); try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
  return { child, send, kill: () => child.kill() };
}

function save(caseId, probeTxt, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeTxt);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status}`);
}

const raw = readFileSync(CSV, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => { const v = l.split(','); const o = {}; header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim())); return o; });

const srv = makeServer();
await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'eval-evidence', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

let hit = 0, miss = 0, na = 0;
for (const r of rows) {
  const resp = await srv.send({ jsonrpc: '2.0', id: rows.indexOf(r) + 2, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: r.prompt } } });
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {}; try { rr = JSON.parse(text); } catch {}
  const svcs = rr.recommendedServices || [];
  const expect = EXPECT[r.id];
  let verdict, status, why;
  if (expect === null) {
    verdict = 'N/A'; status = 'NOT_RUN'; na++;
    why = '诊断类意图（ECS 启动失败分析）不归 service_catalog 服务路由，应走 explain_error 工具；eval harness 判 N/A（无期望服务映射）。';
  } else {
    verdict = svcs.includes(expect) ? 'HIT' : 'MISS';
    if (verdict === 'HIT') { status = 'PASS'; hit++; why = `service_catalog 中文意图正确命中 ${expect}（实际推荐服务 [${svcs.join('+')}]）。`; }
    else { status = 'FAIL'; miss++; why = `service_catalog 未命中期望服务 ${expect}（实际推荐 [${svcs.join('+')} 或空]）。`; }
  }
  save(r.id, `${r.id} | ${verdict} | expected=${expect || '(诊断)'} | actual=${svcs.join('+') || '(空)'} | intent=${r.prompt}`, {
    status, verdict, expected: expect || '(诊断)', actualServices: svcs.join('+'), intent: r.prompt, executedAt: now(), why
  });
}
console.log(`\n=== 路由评测 HIT=${hit} MISS=${miss} N/A=${na} | 准确率=${hit + miss ? ((hit / (hit + miss)) * 100).toFixed(1) : 'N/A'}% ===`);
srv.kill();