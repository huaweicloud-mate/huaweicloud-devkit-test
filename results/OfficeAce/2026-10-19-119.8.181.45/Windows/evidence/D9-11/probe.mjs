// d9-11-ws-tunnel-lifecycle.mjs — D9-11 WebSocket 隧道通道生命周期夹具
// 覆盖：建连→认证→心跳保活→正常断开→异常断开→重新建连（全生命周期）
// 依赖：eval/harness/mock/hwlink-ws-mock.mjs（纯 Node.js WebSocket mock server）
// 用法: node d9-11-ws-tunnel-lifecycle.mjs [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D9-11-lifecycle/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HwlinkMockServer } from '../mock/hwlink-ws-mock.mjs';

const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== 启动 mock server =====
const srv = new HwlinkMockServer({ heartbeatIntervalMs: 0 });
await srv.start();
console.log(`Mock server listening at ${srv.url}`);

// ① 建连：WebSocket 客户端连接到 mock server
let wsConnected = false;
let ws = new WebSocket(srv.url, 'devenv');
ws.binaryType = 'arraybuffer';
await new Promise((resolve) => {
  ws.onopen = () => { wsConnected = true; resolve(); };
  ws.onerror = () => { resolve(); };
});
await sleep(50);
rec('D9-11-LC-connect', 'WebSocket 客户端成功建连 mock server',
    wsConnected === true && srv.connectionCount === 1,
    { connected: wsConnected, serverConns: srv.connectionCount },
    { connected: true, serverConns: 1 });

// ② 认证：发送 auth token，验证服务端认证通过
let authReply = null;
ws.onmessage = (e) => {
  if (typeof e.data === 'string') authReply = e.data;
  else {
    const arr = new Uint8Array(e.data);
    authReply = 'binary:' + arr.length;
  }
};
ws.send('auth:' + srv.authToken);
await sleep(100);
rec('D9-11-LC-auth', '认证握手成功（auth:ok）',
    authReply === 'auth:ok',
    { reply: authReply }, { reply: 'auth:ok' },
    srv.hasAuthedConnection ? '服务端已标记 authed' : '服务端未标记 authed');

// ③ 心跳保活：客户端发 ping，服务端回 pong
authReply = null;
ws.send('ping');
await sleep(100);
rec('D9-11-LC-heartbeat', '心跳保活 ping→pong 往返',
    authReply === 'pong',
    { reply: authReply }, { reply: 'pong' });

// ④ 二进制隧道数据 round-trip：客户端发 binary，服务端 echo 回来
authReply = null;
const testData = new Uint8Array([0x48, 0x57, 0x4C, 0x49, 0x4E, 0x4B]); // "HWLINK"
ws.send(testData);
await sleep(100);
rec('D9-11-LC-binary-roundtrip', '二进制隧道数据 echo 往返',
    authReply === 'binary:' + testData.length,
    { reply: authReply }, { reply: 'binary:' + testData.length });

// ⑤ 正常断开：客户端主动 close，服务端收到 disconnect 事件
let serverDisconnectCount = 0;
srv.on('disconnect', () => { serverDisconnectCount++; });
ws.close(1000, 'normal');
await sleep(200);
rec('D9-11-LC-normal-close', '正常断开（客户端主动 close → 服务端 disconnect）',
    serverDisconnectCount === 1 && srv.connectionCount === 0,
    { disconnects: serverDisconnectCount, remainingConns: srv.connectionCount },
    { disconnects: 1, remainingConns: 0 });

// ⑥ 异常断开：模拟 socket 异常断开（服务端强制关闭连接）
let ws2Connected = false;
let ws2Error = false;
let ws2Closed = false;
ws = new WebSocket(srv.url, 'devenv');
ws.binaryType = 'arraybuffer';
ws.onopen = () => { ws2Connected = true; };
ws.onerror = () => { ws2Error = true; };
ws.onclose = () => { ws2Closed = true; };
await sleep(150);
rec('D9-11-LC-abnormal-setup', '异常断开前建立第二个连接',
    ws2Connected === true && srv.connectionCount === 1,
    { connected: ws2Connected, serverConns: srv.connectionCount },
    { connected: true, serverConns: 1 });

// 服务端强制关闭连接（模拟异常断开）
const connIds = Array.from(srv.connections.keys());
const abnormalConnId = connIds[0];
srv.closeConnection(abnormalConnId);
await sleep(200);
rec('D9-11-LC-abnormal-close', '服务端强制断开 → 客户端收到 close 事件',
    ws2Closed === true && srv.connectionCount === 0,
    { ws2Closed, serverConns: srv.connectionCount },
    { ws2Closed: true, serverConns: 0 },
    '服务端 closeConnection 后客户端收到 close 且连接清零');

// ⑦ 自动重连：客户端连接断开后自动重新建立连接
let ws3Connected = false;
ws = new WebSocket(srv.url, 'devenv');
ws.binaryType = 'arraybuffer';
ws.onopen = () => { ws3Connected = true; };
ws.onerror = () => {};
await sleep(150);
rec('D9-11-LC-reconnect', '断开后可重新建连',
    ws3Connected === true && srv.connectionCount === 1,
    { reconnected: ws3Connected, serverConns: srv.connectionCount },
    { reconnected: true, serverConns: 1 });

// ⑧ 幂等关闭：服务端重复 close 不报错
let closeTwiceOk = false;
try {
  await srv.close();
  await srv.close();
  closeTwiceOk = true;
} catch (e) {
  // 第二次 close 抛错则 closeTwiceOk 保持 false
}
rec('D9-11-LC-close-idempotent', 'close() 幂等（二次调用不报错）',
    closeTwiceOk === true,
    { closeTwiceOk },
    { closeTwiceOk: true });

// ⑨ 关闭后无法建连：mock server 关闭后新连接应失败
let ws4Error = false;
ws = new WebSocket(srv.url, 'devenv');
ws.onerror = () => { ws4Error = true; };
ws.onopen = () => {};
await sleep(200);
rec('D9-11-LC-post-close-reject', '关闭后新连接被拒绝',
    ws4Error === true,
    { error: ws4Error }, { error: true },
    'server 已 close，新连接应失败');

ws.close?.();

// ⑩ 帧日志完整性：生命周期过程中 frameLog 应记录收发帧
rec('D9-11-LC-frame-log', 'frameLog 记录了生命周期帧',
    srv.frameLog.length > 0 && srv.frameLog.some(f => f.dir === 'in') && srv.frameLog.some(f => f.dir === 'out'),
    { totalFrames: srv.frameLog.length, hasIn: srv.frameLog.some(f => f.dir === 'in'), hasOut: srv.frameLog.some(f => f.dir === 'out') },
    { totalFrames: '>0', hasIn: true, hasOut: true });

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-11 WebSocket 隧道通道生命周期 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-11-lifecycle');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D9-11 WebSocket 隧道通道生命周期 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
