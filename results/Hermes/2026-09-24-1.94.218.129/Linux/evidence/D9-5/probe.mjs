// D9-5 (P1): stdio 传输健壮 — 大 payload / 并发 / stdout 纯协议无日志污染
// 断言: 标准 stdio 通道在(1)大 payload (2)并发请求 下不崩溃，stdout 仅含合法 JSON-RPC 帧。
// 结构对齐 protocol-probe.mjs 已验证的帧收发逻辑。
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SERVER = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence/D9-5/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 220), expected: String(expected) });
}

function makeServer() {
  const child = spawn(process.execPath, [SERVER], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  const frameSizes = [];
  let parseErrors = 0;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => {
      pending.set(o.id, r);
      setTimeout(() => { if (pending.has(o.id)) { pending.delete(o.id); r({ id: o.id, error: { code: -32000, message: 'probe-timeout' } }); } }, 20000);
    });
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
      frameSizes.push(n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch { parseErrors++; }
    }
  });
  return { child, send, getState: () => ({ frameSizes, parseErrors, residual: buf.length }) };
}

const srv = makeServer();
try {
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-5-probe', version: '1.0' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  test('D9-5', 'initialize-ok', !!init.result?.protocolVersion, init.result?.protocolVersion || 'no-result', 'protocolVersion');

  const tl = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const nTools = Array.isArray(tl.result?.tools) ? tl.result.tools.length : 0;
  test('D9-5', 'tools-list-ok', nTools > 0, `tools=${nTools}`, '非空工具集');

  // (1) 大 payload：service_catalog 收到 ~100KB intent，server 不崩溃且返回合法响应
  const bigIntent = '帮我查一下云主机有哪些'.repeat(8000); // ~96KB
  const big = await srv.send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: bigIntent } } });
  test('D9-5', 'large-payload-no-crash', !big.error, big.error ? `error=${big.error.message}` : 'result-returned', '大 payload 不崩溃且返回响应');

  // (2) 并发：8 个 tools/list 同时发，全部返回
  const ids = [4, 5, 6, 7, 8, 9, 10, 11];
  const conns = await Promise.all(ids.map((id) => srv.send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} })));
  const allOk = conns.every((r) => Array.isArray(r.result?.tools) && r.result.tools.length > 0);
  test('D9-5', 'concurrent-8-ok', allOk, `${conns.filter(r=>r.result).length}/8`, '8 并发全返回');

  // (3) stdout 纯协议：所有帧均为合法 JSON（无日志污染），无残留半帧
  const st = srv.getState();
  test('D9-5', 'stdout-pure-protocol', st.parseErrors === 0 && st.residual === 0, `frames=${st.frameSizes.length} parseErrors=${st.parseErrors} residual=${st.residual}`, '无解析失败 + 无残留字节');

  // (4) 压力后仍存活
  const ping = await srv.send({ jsonrpc: '2.0', id: 12, method: 'tools/list', params: {} });
  test('D9-5', 'post-stress-alive', Array.isArray(ping.result?.tools), `tools=${Array.isArray(ping.result?.tools)?ping.result.tools.length:'?'}`, '压力后仍存活');
} catch (e) {
  test('D9-5', 'probe-exception', false, String(e).slice(0, 160), '无异常');
} finally {
  try { srv.child.kill(); } catch {}
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);
process.exit(0);