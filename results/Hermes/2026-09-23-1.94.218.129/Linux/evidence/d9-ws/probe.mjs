// D9-11: WebSocket 隧道通道生命周期 (HwlinkTunnelChannel attach/onopen/close)
import { writeFileSync } from 'node:fs';
import { HwlinkTunnelChannel } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/ws-exec/hwlink-tunnel-channel.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/d9-ws/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 160), expected: String(expected) });
}

// mock mux: register/unregister/sendFairly/source/channels/queue
let registered = 0, unregistered = 0, sendCount = 0;
const mux = {
  source: 1,
  channels: new Map(),
  queue: { register: () => {}, unregister: () => {} },
  register(ch) { registered++; mux.channels.set(ch.identifier || 'root', ch); },
  unregister(ch) { unregistered++; },
  sendFairly(ch, data) { sendCount++; },
};

let readyResolved = false, closeFired = false;
const ch = new HwlinkTunnelChannel({
  remotePort: 8080,
  onReady: () => { readyResolved = true; },
  onClose: () => { closeFired = true; },
});
ch.attach(mux);
test('D9-11', 'attach-registers', registered === 1, `registered=${registered}`, 'attach 注册到 mux');

ch.onopen();
try { await Promise.race([ch.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))]); } catch {}
test('D9-11', 'ready-resolve-on-open', ch.opened === true && !!ch.localServer, `opened=${ch.opened} localServer=${!!ch.localServer}`, 'onopen 启动 localServer 且 ready 就绪');

ch.close();
test('D9-11', 'close-lifecycle', ch.closed === true && ch.localServer === null && ch.subConnections.size === 0 && closeFired === true && unregistered >= 1,
  `closed=${ch.closed} localServer=${ch.localServer} subs=${ch.subConnections.size} onClose=${closeFired} unreg=${unregistered}`,
  'close 后 localServer 关闭、subConnections 清空、onClose 触发、mux 注销');

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);