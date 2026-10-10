// replay.mjs — 录制回放驱动（Record & Playback，test-panorama-plan §6.2-6.4）
//
// 链路：加载录制基线（recordings/*.jsonl）→ spawn mcp-server → 逐条调
// huaweicloud_service_catalog(intent) → 用 compare.mjs 语义差异分类 → 落盘 results/replay-<ts>.csv。
//
// 用法:
//   node eval/replay/replay.mjs [mcp-server路径] [--recording recordings/serviceCatalog-v1.jsonl] [--outdir eval/replay/results]
//   mcp-server 路径缺省自动定位：HDK_PATH/HUAWEICLOUD_DEVKIT_HOME → sibling ../hdk
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compare, isPass } from './compare.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

function resolveMcpServer() {
  if (process.argv[2] && !process.argv[2].startsWith('--')) return process.argv[2];
  for (const key of ['HDK_PATH', 'HUAWEICLOUD_DEVKIT_HOME']) {
    if (process.env[key]) {
      const p = join(process.env[key], 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
      if (existsSync(p)) return p;
    }
  }
  const sibling = join(REPO_ROOT, '..', 'hdk', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  if (existsSync(sibling)) return sibling;
  throw new Error('无法定位 mcp-server.mjs，请传路径或设置 HDK_PATH/HUAWEICLOUD_DEVKIT_HOME');
}

function argOf(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const DEFAULT_RECORDING = join(__dirname, 'recordings', 'serviceCatalog-v1.jsonl');
const recordingPath = argOf('--recording') || DEFAULT_RECORDING;
const outDir = argOf('--outdir') || join(__dirname, 'results');
const serverPath = resolveMcpServer();

// ---- MCP stdio 客户端（Content-Length framing，与 run-eval.mjs 一致）----
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
  return { send, call, id: () => _id++, kill: () => child.kill() };
}

// 读取录制基线 JSONL
function loadRecordings(path) {
  const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
  return raw.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}

const recordings = loadRecordings(recordingPath);
console.log(`录制基线: ${recordingPath}（${recordings.length} 条）`);
console.log(`mcp-server: ${serverPath}\n`);

const srv = makeServer(serverPath);
await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'devkit-replay', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const rows = [];
for (const rec of recordings) {
  process.stdout.write(`${rec.id} | ${String(rec.prompt).slice(0, 18)}… `);
  let resp;
  try {
    resp = await srv.call('huaweicloud_service_catalog', { intent: rec.prompt });
  } catch (e) {
    console.log(`ERR(${e.message})`);
    rows.push({ id: rec.id, prompt: rec.prompt, expected: (rec.expectedServices || []).join('+'), actual: '', verdict: 'ERROR', pass: false, reasons: e.message });
    continue;
  }
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {};
  try { rr = text ? JSON.parse(text) : {}; } catch {}
  const svcs = (rr.recommendedServices || []).map(String);
  // provider 提示命中服务名也算语义等价
  const actualLabel = svcs.length ? svcs.join('+') : (rr.providerHint || '');

  const expectedList = (rec.expectedTools && rec.expectedTools.length
    ? rec.expectedTools
    : (rec.expectedServices || []));
  const actualList = svcs.length ? svcs : (actualLabel ? [actualLabel] : []);

  const cmp = compare({
    expectedTools: expectedList,
    actualTools: actualList,
    options: { skipBaselineValidation: false, secretProbe: text },
  });
  console.log(`→ ${cmp.verdict} | 期望=${expectedList.join('+')} | 实际=${actualList.join('+')}${cmp.reasons.length ? ' | ' + cmp.reasons.join('; ') : ''}`);
  rows.push({
    id: rec.id,
    prompt: rec.prompt,
    expected: expectedList.join('+'),
    actual: actualList.join('+'),
    verdict: cmp.verdict,
    pass: isPass(cmp.verdict),
    reasons: cmp.reasons.join('; '),
  });
}

const passN = rows.filter((r) => r.pass).length;
const failN = rows.length - passN;
console.log(`\n=== 录制回放汇总 ===`);
console.log(`通过=${passN} 失败=${failN} / 总=${rows.length} | 通过率=${rows.length ? ((passN / rows.length) * 100).toFixed(1) : '0'}%`);

mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const outPath = join(outDir, `replay-${ts}.csv`);
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const csvOut = ['id,prompt,expected,actual,verdict,pass,reasons']
  .concat(rows.map((r) => [r.id, r.prompt, r.expected, r.actual, r.verdict, r.pass, r.reasons].map(esc).join(',')))
  .join('\n') + '\n';
writeFileSync(outPath, csvOut, 'utf-8');
console.log(`结果落盘: ${outPath}`);

srv.kill();
process.exit(rows.some((r) => !r.pass) ? 1 : 0);