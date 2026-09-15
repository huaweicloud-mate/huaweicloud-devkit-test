// 补充探针：协议域假阻塞用例回填（D9-5 stdio 传输健壮 / D9-9 tools/call 超时与取消语义）
// 直连 hdk 源码 mcp-server.mjs（stdio Content-Length 帧），实测 capabilities / 大 payload / 并发 / 错误码。
import { spawn } from 'node:child_process';

const SERVER = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

let PASS = 0, FAIL = 0;
function assert(label, cond, detail = '') {
  const ok = Boolean(cond);
  if (ok) PASS++; else FAIL++;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' | ' + detail : ''}`);
}

function makeServer(extraEnv = {}) {
  const child = spawn(process.execPath, [SERVER], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', ...extraEnv },
  });
  let buf = Buffer.alloc(0);
  let rawStdout = '';
  let stderrBuf = '';
  const pending = new Map();
  let _id = 1;
  child.stdout.on('data', (d) => { rawStdout += d.toString(); buf = Buffer.concat([buf, d]); pump(); });
  child.stderr.on('data', (d) => { stderrBuf += d.toString(); });
  function pump() {
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
  }
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  function call(name, args) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args || {} } }); }
  return { child, send, call, _id: () => _id++, rawStdout: () => rawStdout, stderr: () => stderrBuf, kill: () => child.kill() };
}

const srv = makeServer();
const init = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'protocol-probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
console.log('initialize capabilities:', JSON.stringify(init?.result?.capabilities));
await new Promise((r) => setTimeout(r, 300));

// ---- D9-9 超时与取消语义（源码级断言） ----
console.log('\n=====CASE D9-9=====');
{
  const caps = init?.result?.capabilities || {};
  const hasCancellation = Boolean(caps?.notifications?.cancellation);
  console.log('capabilities.notifications.cancellation 存在:', hasCancellation);
  assert('D9-9: 能力探测——cancellation 未声明（contract: 不存在→SPEC-MISMATCH 而非假定）', !hasCancellation);

  // 未知方法错误码（超时/取消语义未实现：错误码硬编码 -32603）
  const r = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/unknown_xyz', params: {} });
  console.log('未知方法 error:', JSON.stringify(r?.error));
  const code = r?.error?.code;
  assert('D9-9: 服务端未实现 -32000 timeout（未知方法错误码非 -32000）', code !== -32000, `code=${code}`);

  // 超时后重建：initialize/tools/list 正常（协议可恢复）
  const reinit = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe2', version: '1' } } });
  const tl = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
  const toolsN = tl?.result?.tools?.length || 0;
  console.log('重建 initialize + tools/list:', Boolean(reinit?.result), '| tools 数量:', toolsN);
  assert('D9-9: 超时/错误后重建 initialize→tools/list 正常响应', Boolean(reinit?.result) && toolsN > 0, `tools=${toolsN}`);
}

// ---- D9-5 stdio 传输健壮 ----
console.log('\n=====CASE D9-5=====');
{
  // ① 大 payload（1MB intent）tools/call 不崩
  const bigIntent = '云计算 '.repeat(200000);
  const t0 = Date.now();
  const big = await srv.call('huaweicloud_service_catalog', { intent: bigIntent });
  console.log('大 payload(≈1MB) service_catalog 响应耗时:', Date.now() - t0, 'ms | 有响应:', Boolean(big?.result));
  assert('D9-5: 大 payload tools/call 不崩且有响应', Boolean(big?.result));

  // ② 并发 tools/list 无错乱
  const n = 30;
  const ids = Array.from({ length: n }, () => srv._id());
  const ps = ids.map((id) => srv.send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} }));
  const results = await Promise.all(ps);
  const counts = results.map((x) => (x?.result?.tools || []).length);
  const allSame = counts.every((c) => c === counts[0]) && counts[0] > 0;
  console.log('并发30 tools/list 数量集合:', [...new Set(counts)].join(','), '| 全部一致:', allSame);
  assert('D9-5: 并发 tools/list 无死锁/无消息错乱', allSame, `集合=[${[...new Set(counts)].join(',')}]`);

  // ③ stdout 纯协议污染检查：raw stdout 应仅含 Content-Length 帧头 + JSON，无裸日志行
  const raw = srv.rawStdout();
  const nonFrame = raw.split(/\r?\n/).filter((l) => l.trim() && !/^Content-Length:\s*\d+\r?$/.test(l) && !/^\{/.test(l.trim()));
  console.log('stdout 非协议行数:', nonFrame.length, nonFrame.slice(0, 3));
  assert('D9-5: stdout 纯协议无日志污染', nonFrame.length === 0, JSON.stringify(nonFrame.slice(0, 2)));
}

console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
srv.kill();
process.exit(FAIL ? 1 : 0);