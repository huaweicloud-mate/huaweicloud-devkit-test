// D9-11 WebSocket 隧道通道生命周期 —— hwlink mux harness
// HwlinkTunnelChannel attach(mux) → onopen → ready resolve → close 后清理
// 链接 SUT ws-exec/hwlink-tunnel-channel.mjs + mock mux
// 用法: node d9-11-ws-tunnel.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D9-11/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d9-11-ws-tunnel.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const tunnelMod = await import(new URL(`file://${hdkSrc}/ws-exec/hwlink-tunnel-channel.mjs`).href);
const { HwlinkTunnelChannel } = tunnelMod;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// mock mux：记录 register/unregister/closed
const mockMux = {
  source: 1,
  channels: new Map(),
  queue: { register() {}, unregister() {} },
  register(c) { this.channels.set(c.identifier, c); },
  unregister(c) { this.channels.delete(c.identifier); },
  sendFairly() {},
};

let onCloseCalls = 0;
let onReadyCalls = 0;
const ch = new HwlinkTunnelChannel({ localPort: 0, remotePort: 22, onReady: () => { onReadyCalls++; }, onClose: () => { onCloseCalls++; } });

// ① attach 注册到 mux
const idBefore = ch.identifier;
ch.attach(mockMux);
rec('D9-11-attach', 'attach 注册到 mux', mockMux.channels.has(ch.identifier) === true, { registered: mockMux.channels.has(ch.identifier), id: ch.identifier }, true);

// ② onopen → localServer 创建 + ready Promise resolve
let readyResolved = false;
ch.ready.then(() => { readyResolved = true; });
ch.onopen();
await sleep(300);
const localPort = ch.localPort;
rec('D9-11-onopen-localserver', 'onopen 后 localServer 监听', ch.localServer !== null && typeof localPort === 'number' && localPort > 0,
    { localServer: !!ch.localServer, localPort }, { localServer: true, localPort: '>0' });
rec('D9-11-ready-resolve', 'ready Promise 在 open 时 resolve', readyResolved === true && onReadyCalls === 1, { readyResolved, onReadyCalls }, { readyResolved: true, onReadyCalls: 1 });

// ③ 模拟一条 subConnection
const net = await import('node:net');
ch.onIncomingConnection?.({ identifier: 999, write() {}, end() {}, on() {}, destroyed: false, destroy() {} });
const subCount = ch.subConnections.size;
rec('D9-11-subconn-open', '子连接注册到 subConnections', subCount >= 1, { subConnections: subCount }, { subConnections: '>=1' });

// ④ close → localServer 关闭 + subConnections 清空 + onClose 回调触发 + mux 注销
ch.close();
await sleep(100);
rec('D9-11-close-cleanup', 'close 后 localServer 关闭/subConnections 清空', ch.closed === true && ch.localServer === null && ch.subConnections.size === 0,
    { closed: ch.closed, localServer: ch.localServer, subConnections: ch.subConnections.size }, { closed: true, localServer: null, subConnections: 0 });
rec('D9-11-close-mux-unregister', 'close 后 mux 通道注销', mockMux.channels.has(ch.identifier) === false, { registered: mockMux.channels.has(ch.identifier) }, false);
rec('D9-11-close-callback', 'onClose 回调触发', onCloseCalls === 1, { onCloseCalls }, { onCloseCalls: 1 });

// ⑤ 幂等：重复 close 不重复触发
ch.close();
await sleep(50);
rec('D9-11-close-idempotent', '重复 close 幂等（onClose 仅触发 1 次）', onCloseCalls === 1, { onCloseCalls }, { onCloseCalls: 1 });

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-11 WebSocket 隧道通道生命周期 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-11');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D9-11 WebSocket 隧道通道生命周期 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);