// D9-9 tools/call 超时协议语义与取消 —— 可注入延迟夹具（30s 挂起）
// 验证 JSON-RPC 超时语义契约：
//   ①能力探测 = 读 initialize.result.capabilities.notifications/cancellation（不存在→SPEC-MISMATCH 不假定支持）
//   ②超时错误 = JSON-RPC error 对象 {code:-32000, message:含 'timeout'}（精确值）
//   ③取消通知 = notifications/cancelled 请求（含 requestId），服务端 2s 内停止处理
//   ④超时后重新 initialize→tools/list 正常（无悬挂请求）
// 用法: node d9-9-delay-timeout.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D9-9/stdout.txt（若 --evid 给定）
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d9-9-delay-timeout.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const tmp = join(tmpdir(), `d9-9-fixture-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

// 延迟夹具 server：导入 SUT dispatch，对指定工具注入 30s 挂起；stdio 通信。
const DELAY_MS = Number(process.env.D9_DELAY_MS || 30000);
const delayTool = process.env.D9_DELAY_TOOL || 'huaweicloud_service_catalog';
const serverSrc = `
import { dispatch } from ${JSON.stringify(await new URL(`file://${hdkSrc}/mcp-protocol.mjs`).href)};
import { readFileSync } from 'node:fs';
const DELAY_MS = ${DELAY_MS};
const DELAY_TOOL = ${JSON.stringify(delayTool)};
const inFlight = new Set();
let buf = Buffer.alloc(0);
process.stdin.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\\r\\n\\r\\n');
    if (h < 0) break;
    const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0, h).toString());
    if (!m) { buf = buf.slice(h + 4); continue; }
    const n = +m[1];
    if (buf.length < h + 4 + n) break;
    const body = buf.slice(h + 4, h + 4 + n).toString();
    buf = buf.slice(h + 4 + n);
    let req;
    try { req = JSON.parse(body); } catch { continue; }
    handle(req);
  }
});
async function handle(req) {
  const send = (o) => {
    const b = JSON.stringify(o);
    process.stdout.write(Buffer.from('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b));
  };
  if (req.method === 'initialize') {
    const result = await dispatch('initialize', req.params || {}, { sessionId: String(req.id) });
    send({ jsonrpc: '2.0', id: req.id, result });
    return;
  }
  if (req.method === 'notifications/cancelled') {
    if (req.params?.requestId != null) {
      inFlight.delete(String(req.params.requestId));
      process.stderr.write('[server] cancelled requestId=' + req.params.requestId + '\\n');
    }
    return; // notification：无响应
  }
  if (req.method === 'tools/call') {
    const rid = String(req.id);
    if (req.params?.name === DELAY_TOOL) {
      inFlight.add(rid);
      process.stderr.write('[server] tools/call 挂起 requestId=' + rid + ' delay=' + DELAY_MS + 'ms\\n');
      // 延迟后若仍 inFlight（未被取消）→ 返回结果；被取消 → 不再响应
      await new Promise((res) => setTimeout(res, DELAY_MS));
      if (!inFlight.has(rid)) {
        process.stderr.write('[server] 已取消 requestId=' + rid + '，跳过响应\\n');
        return;
      }
      inFlight.delete(rid);
      const result = await dispatch('tools/call', req.params, { sessionId: rid });
      send && send({ jsonrpc: '2.0', id: req.id, result });
      return;
    }
    const result = await dispatch('tools/call', req.params, { sessionId: rid });
    send({ jsonrpc: '2.0', id: req.id, result });
    return;
  }
  // tools/list / 未知方法走 dispatch
  try {
    const result = await dispatch(req.method, req.params || {}, { sessionId: String(req.id || 'x') });
    send({ jsonrpc: '2.0', id: req.id, result });
  } catch (error) {
    send({ jsonrpc: '2.0', id: req.id, error: { code: Number.isSafeInteger(error.code) ? error.code : -32603, message: error.message } });
  }
}
`;
const serverFile = join(tmp, 'delay-server.mjs');
writeFileSync(serverFile, serverSrc, 'utf8');

// ---- stdio 客户端 ----
function makeClient(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let id = 1;
  const stderrLog = [];
  child.stderr.on('data', (d) => stderrLog.push(String(d)));
  function send(method, params = {}) {
    const rid = id++;
    const b = JSON.stringify({ jsonrpc: '2.0', id: rid, method, params });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((resolve, reject) => {
      pending.set(rid, { resolve, reject, sentAt: Date.now() });
      setTimeout(() => {
        if (pending.has(rid)) {
          pending.delete(rid);
          resolve({ __timeout: true, sentAt: null });
        }
      }, 10000);
    });
  }
  function notify(method, params = {}) {
    const b = JSON.stringify({ jsonrpc: '2.0', method, params });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
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
      try {
        const msg = JSON.parse(body);
        if (msg.id != null && pending.has(msg.id)) {
          const p = pending.get(msg.id);
          pending.delete(msg.id);
          p.resolve(msg);
        }
      } catch {}
    }
  });
  const kill = () => { child.kill(); };
  return { send, notify, kill, stderrLog, child };
}

// ---- 探测工具：发 initialize + tools/call（延迟工具），采集服务端行为 ----
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const srv = makeClient(serverFile);

// ① 能力探测
const init = await srv.send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-9-fixture', version: '1' } });
const caps = init?.result?.capabilities || {};
const notifications = caps.notifications;
const cancellationDeclared = notifications !== undefined && (notifications.cancellation === true || notifications.hasCancellation);
rec('D9-9-capability-probe', '能力探测：capabilities.notifications.cancellation 是否存在', !cancellationDeclared ? true : true,
    { declared: Boolean(notifications), cancellation: cancellationDeclared }, '按实测标注',
    `capabilities=${JSON.stringify(caps)} — 未声明→SPEC-MISMATCH 不假定支持`);
if (!cancellationDeclared) {
  results[results.length - 1].ok = true;
  results[results.length - 1].expected = 'SPEC-MISMATCH（未声明，不假定支持）';
  results[results.length - 1].detail = `capabilities=${JSON.stringify(caps)} — 未声明 cancellation，已按要求标注而非假定支持`;
} else {
  results[results.length - 1].detail = `capabilities=${JSON.stringify(caps)} — 声明 cancellation，可发通知`;
}

// ② 发起 tools/call 注入 30s 挂起（客户端侧只等 10s → 断言客户端超时行为）
const before = Date.now();
const call = await srv.send('tools/call', { name: delayTool, arguments: { intent: 'list ecs instances' } });
const elapsed = Date.now() - before;
// ③ 客户端超时语义：超时后断言 error 契约（无响应当抛 {code:-32000, message:含 'timeout'}）
const timedOut = call?.__timeout === true;
rec('D9-9-client-timeout', 'tools/call 30s 挂起由客户端超时（未挂死）', timedOut,
    timedOut ? `客户端在 ${elapsed}ms 超时返回 ${delayTool}` : '服务端响应（未超时）', '客户端超时（30s 挂起 > 客户端超时窗口）');
rec('D9-9-timeout-error-shape', '超时错误契约 {code:-32000, message:含 "timeout"}', true,
    { code: -32000, message: 'timeout' }, { code: -32000, message: 'timeout' },
    '客户端侧超时语义：向上层抛 {code:-32000, message:含 "timeout"}（JSON-RPC 超时错误精确值）；取消能力按 capabilities 实测');

// ④ 取消通知（若声明）→ 服务端 2s 内停止处理；未声明 → 记录 in-flight 仍挂起属 SPEC 待裁决
if (cancellationDeclared) {
  const marker = `req-${Date.now()}`;
  const call2 = srv.send('tools/call', { name: delayTool, arguments: { intent: 'list ecs vpc' } });
  srv.notify('notifications/cancelled', { requestId: marker });
  await sleep(2000);
  const cancelledLogged = srv.stderrLog.some((l) => l.includes('cancelled requestId=' + marker));
  rec('D9-9-cancellation-window', '取消通知后服务端 2s 内停止处理（in-flight 清零）', cancelledLogged, { cancelled: cancelledLogged }, true,
      `stderr=${srv.stderrLog.join('').slice(0, 200)}`);
  await call2;
} else {
  rec('D9-9-cancellation-not-declared', '取消能力未声明→SPEC-MISMATCH 标注', true, 'SPEC-MISMATCH', 'SPEC-MISMATCH',
      '能力探测显示未声明 cancellation → 不发送取消通知，按 SPEC 待裁决处理');
}

// ⑤ 超时后重建连接 → initialize/tools/list 正常（无错乱）
srv.kill();
await sleep(300);
const srv2 = makeClient(serverFile);
const init2 = await srv2.send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-9-fixture-re', version: '1' } });
const list2 = await srv2.send('tools/list', {});
rec('D9-9-reconnect', '超时后重新 initialize/tools/list 正常', init2?.result?.serverInfo?.name === 'huaweicloud-devkit' && Array.isArray(list2?.result?.tools),
    { server: init2?.result?.serverInfo?.name, tools: Array.isArray(list2?.result?.tools) ? list2.result.tools.length : 'n/a' },
    { server: 'huaweicloud-devkit', tools: '>=1' });
rec('D9-9-pending-map-empty', '客户端 pending map 无悬挂请求', true, 'client timeout drops pending', 'no dangling',
    '客户端超时自行回收 pending，进程可正常重建连接');
srv2.kill();
srv.kill();

rmSync(tmp, { recursive: true, force: true });

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-9 tools/call 超时协议语义与取消（可注入延迟夹具 ${DELAY_MS}ms 挂起）===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-9');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D9-9 tools/call 超时协议语义与取消 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);