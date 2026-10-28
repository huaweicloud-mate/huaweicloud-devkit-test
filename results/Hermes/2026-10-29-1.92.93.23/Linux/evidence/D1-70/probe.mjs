// D1-70 代理配置与 WebSocket 代理 —— 源码级探针（Hermes Linux）
// 校验: writeProxyConfig/readProxyConfig/clearProxyConfig/getProxySettings(env+file, no_proxy 绕过)
//       getProxyDispatcher / createProxyWebSocket / getWebSocketImpl(有代理走 undici, 无代理回退 globalThis.WebSocket)
// 用法: node probe.mjs <huaweicloud-core/src 目录(安装包副本, 含 undici)>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const srcDir = process.argv[2];
const S = (f) => join(srcDir, f);

const results = [];
function check(name, ok, detail) {
  results.push({ name, pass: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' -> ' + detail : ''}`);
}

const proxyConfig = await import(pathToFileURL(S('proxy/proxy-config.mjs')).href);
const proxyAgent = await import(pathToFileURL(S('proxy/proxy-agent.mjs')).href);

// --- ① write/read/clear 往返 ---
const cfg = { http_proxy: 'http://proxy.example:8080', https_proxy: 'http://proxy.example:8080', no_proxy: 'internal.corp.com' };
proxyConfig.writeProxyConfig(cfg);
const back = proxyConfig.readProxyConfig();
check('writeProxyConfig 往返', back.http_proxy === cfg.http_proxy && back.https_proxy === cfg.https_proxy, JSON.stringify(back));
proxyConfig.clearProxyConfig();
const cleared = proxyConfig.readProxyConfig();
check('clearProxyConfig 后为空', cleared === null || Object.keys(cleared || {}).length === 0, 'cleared');

// --- ② getProxySettings env+file 优先 + no_proxy 命中返回 null ---
proxyConfig.writeProxyConfig(cfg);
const gs = proxyConfig.getProxySettings('https://external.example.com/api');
check('getProxySettings 命中 file 代理', gs?.proxyUrl === 'http://proxy.example:8080', JSON.stringify(gs));

const bypass = proxyConfig.getProxySettings('https://internal.corp.com/x');
check('no_proxy 命中返回 null', bypass === null, JSON.stringify(bypass));

process.env.HTTPS_PROXY = 'http://env-proxy:9999';
const gsEnv = proxyConfig.getProxySettings('https://external.example.com/api');
check('env 优先于 file', gsEnv?.proxyUrl === 'http://env-proxy:9999', JSON.stringify(gsEnv));
delete process.env.HTTPS_PROXY;
proxyConfig.clearProxyConfig();

// --- ③ 无代理时 getProxyDispatcher / createProxyWebSocket / getWebSocketImpl 回退 ---
const noProxyDispatcher = await proxyAgent.getProxyDispatcher('https://external.example.com/api');
check('无代理时 getProxyDispatcher 返回 undefined', noProxyDispatcher === undefined, String(noProxyDispatcher));

const wsNoProxy = await proxyAgent.createProxyWebSocket('wss://external.example.com/ws');
check('无代理时 createProxyWebSocket 回退 globalThis.WebSocket', wsNoProxy instanceof globalThis.WebSocket, wsNoProxy?.constructor?.name);

const wsImpl = await proxyAgent.getWebSocketImpl('https://external.example.com/api');
check('无代理时 getWebSocketImpl 返回 globalThis.WebSocket', wsImpl === globalThis.WebSocket, wsImpl?.name);

// --- ④ 有代理时 getProxyDispatcher 走 undici ProxyAgent ---
proxyConfig.writeProxyConfig(cfg);
const dispatcher = await proxyAgent.getProxyDispatcher('https://external.example.com/api');
check('有代理时 getProxyDispatcher 返回 ProxyAgent(undici)', dispatcher?.constructor?.name === 'ProxyAgent', dispatcher?.constructor?.name);
const wsImplProxy = await proxyAgent.getWebSocketImpl('https://external.example.com/api');
check('有代理时 getWebSocketImpl 返回 ProxyWebSocket(undici)', typeof wsImplProxy === 'function' && wsImplProxy !== globalThis.WebSocket, wsImplProxy?.name);
proxyAgent.clearProxyDispatcherCache();
proxyConfig.clearProxyConfig();

const allPass = results.length > 0 && results.every((r) => r.pass);
const out = { status: allPass ? 'PASS' : 'FAIL', results, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14) };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out));
console.log('=== DONE', out.status, '===');