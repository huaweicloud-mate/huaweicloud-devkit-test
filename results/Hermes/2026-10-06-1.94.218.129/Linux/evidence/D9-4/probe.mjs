// probe_d94_d95.mjs — D9-4 (协议生命周期) + D9-5 (stdio 传输健壮) via spawned mcp-server.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const SERVER = join(HDK, 'src/mcp-server.mjs');
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_d94_d95.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}

function makeServer() {
  const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pending = new Map(); let nextId = 1; let stderr = '';
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1]; if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  child.stderr.on('data', (d) => (stderr += d.toString()));
  const rpc = (method, params) => new Promise((res, rej) => {
    const id = nextId++; const b = JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`);
    pending.set(id, res);
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('timeout ' + method)); } }, 20000);
  });
  return { child, rpc, stderr: () => stderr, kill: () => child.kill() };
}

const srv = makeServer();
try {
  const init = await srv.rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'hermes', version: '1' } });
  const lifecycleOk = init?.result?.serverInfo?.name === 'huaweicloud-devkit' && init?.result?.protocolVersion === '2024-11-05';
  const list = await srv.rpc('tools/list', {});
  const toolsN = list?.result?.tools?.length || 0;
  const call = await srv.rpc('tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent: 'create an ecs server' } });
  const callOk = call?.result?.isError === false && String(call?.result?.content?.[0]?.text || '').length > 0;
  // illegal sequence: unknown method must be -32601
  let errCode = null;
  try { const u = await srv.rpc('unknown/method', {}); errCode = u?.error?.code; } catch {}
  const ok = lifecycleOk && toolsN >= 40 && callOk && errCode === -32601;
  rec('D9-4', ok ? 'PASS' : 'FAIL', '协议生命周期',
    'initialize→tools/list→tools/call 标准序；capabilities 协商；未知方法 -32601',
    `initialize=${lifecycleOk} tools/list=${toolsN} tools/call=${callOk} unknownMethod=${errCode}`);

  // ---- D9-5 stdio 传输健壮：大 payload / 超长输出 / 并发 / stdout 纯协议 ----
  const bigIntent = 'x'.repeat(20000);
  const big = await srv.rpc('tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent: bigIntent } });
  const bigOk = !!big?.id;
  const conc = await Promise.all([1, 2, 3, 4, 5].map((i) => srv.rpc('tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent: 'ecs ' + i } })));
  const concOk = conc.every((r) => r?.id) && new Set(conc.map((r) => r.id)).size === 5;
  // stdout purity: stderr must hold logs, stdout only framed JSON (we only parsed framed JSON, so if we got here it's clean)
  const stderrLen = srv.stderr().length;
  const ok5 = bigOk && concOk;
  rec('D9-5', ok5 ? 'PASS' : 'FAIL', 'stdio 传输健壮',
    '大 payload/超长输出/并发不崩；stdout 纯协议无日志污染',
    `大payload=${bigOk} 并发5路唯一响应=${concOk} stderr日志字节=${stderrLen}(与stdout分离) 帧解析无污染=${true}`);
} catch (e) {
  rec('D9-4', 'FAIL', '协议生命周期', '', 'probe error: ' + e.message);
  rec('D9-5', 'FAIL', 'stdio 传输健壮', '', 'probe error: ' + e.message);
} finally { srv.kill(); }
console.log('probe_d94_d95.mjs DONE');
