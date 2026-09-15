// protocol-probe.mjs：D9 协议层探针（可复现）
// 覆盖：D9-2 JSON-RPC 错误码 / D9-4 协议生命周期 / D9-9 capabilities.cancellation 探测
// 用法: node protocol-probe.mjs <mcp-server.mjs 路径>
// 输出: eval/results/protocol-probe-<YYYYMMDDHHmmss>.json + 控制台断言汇总
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2];
if (!serverPath) {
  console.error('用法: node protocol-probe.mjs <mcp-server.mjs 路径>');
  process.exit(2);
}

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
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function raw(jsonrpc2) {
    return send(jsonrpc2);
  }
  return { child, send, raw, kill: () => child.kill() };
}

const results = [];
function rec(id, expect, got, verdict, detail) {
  results.push({ id, expect, got, verdict, detail });
  console.log(`${id} | ${verdict.padEnd(6)} | 期望=${expect} | 实际=${got}${detail ? ' | ' + detail : ''}`);
}

const srv = makeServer(serverPath);

// ===== D9-4 生命周期：initialize → notifications/initialized → tools/list =====
const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'protocol-probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const caps = init?.result?.capabilities || {};
const cancSupports = caps.notifications !== undefined;
const cancDeclared = cancSupports && caps.notifications.cancellation === true;
rec('D9-9a-capabilities.cancellation', '声明 notifications.cancellation', cancDeclared ? '已声明' : '未声明',
    cancDeclared ? 'PASS' : 'SPEC-MISMATCH', 'initialize.result.capabilities.notifications = ' + JSON.stringify(caps.notifications ?? '(缺失)'));

const tl = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
const toolCount = Array.isArray(tl?.result?.tools) ? tl.result.tools.length : 0;
rec('D9-4-lifecycle-tools/list', 'tools/list 正常返回(数组非空)', `${toolCount} 工具`, toolCount > 0 ? 'PASS' : 'FAIL', '');

// ===== D9-2 JSON-RPC 错误码 =====
// -32601 Method not found：发不存在的 method
const unknown = await srv.send({ jsonrpc: '2.0', id: 3, method: 'tools/unknown_method_xyz', params: {} });
rec('D9-2a-unknown-method', '-32601 (Method not found)', String(unknown?.error?.code ?? '无 error 对象'),
    unknown?.error?.code === -32601 ? 'PASS' : 'FAIL', 'error.code');

// -32602 Invalid params：tools/list 带非法参数类型（params 应为 object，传 string）
const badParam = await srv.send({ jsonrpc: '2.0', id: 4, method: 'tools/list', params: 'not-an-object' });
rec('D9-2b-invalid-params', '-32602 (Invalid params)', String(badParam?.error?.code ?? '无 error 对象'),
    badParam?.error?.code === -32602 ? 'PASS' : 'FAIL', 'error.code');

// ===== 汇总 + 落盘 =====
const hit = results.filter(r => r.verdict === 'PASS').length;
console.log(`\n=== D9 协议探针汇总 ===`);
console.log(`PASS=${hit}/${results.length}（SPEC-MISMATCH 记作契约漂移、FAIL 记作缺陷）`);

const outDir = join(__dirname, '..', 'results');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const outPath = join(outDir, `protocol-probe-${ts}.json`);
writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), serverPath, results }, null, 2), 'utf-8');
console.log(`结果落盘: ${outPath}`);

srv.kill();
process.exit(0);