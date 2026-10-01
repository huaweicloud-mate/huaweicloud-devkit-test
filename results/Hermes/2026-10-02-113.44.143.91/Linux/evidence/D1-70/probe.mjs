// D1-70 代理配置与 WebSocket 代理 聚焦探针 — Hermes/Linux/2026-10-01 v1.1.8-next.1 (ffd7b474)
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const pc = await import(`file://${HDK}/src/proxy/proxy-config.mjs`);
const pa = await import(`file://${HDK}/src/proxy/proxy-agent.mjs`);

const results = [];
function record(id, pass, actual, expected, why) { results.push({ id, pass, actual: String(actual).slice(0,120), expected, why }); }

try {
  pc.writeProxyConfig({ http_proxy: 'http://127.0.0.1:7890', no_proxy: 'localhost,127.0.0.1' });
  const read = pc.readProxyConfig();
  record('proxy-write-read', !!read && read.http_proxy === 'http://127.0.0.1:7890', JSON.stringify(read), 'http_proxy 落盘', '');
  const hit = pc.getProxySettings('http://example.com');
  record('proxy-hit', !!hit && hit.proxyUrl === 'http://127.0.0.1:7890', JSON.stringify(hit), 'proxyUrl 命中', '');
  const bypass = pc.getProxySettings('http://127.0.0.1');
  record('proxy-no-proxy', bypass === null, JSON.stringify(bypass), 'null（no_proxy 绕过）', '');
  const noProxyCfg = pc.getProxySettings('http://example.com');
  record('proxy-env-file-merge', !!noProxyCfg, JSON.stringify(noProxyCfg), 'env+file 合并', '');
  record('ws-proxy-factory', typeof pa.createProxyWebSocket === 'function', typeof pa.createProxyWebSocket, 'function', '');
  pc.clearProxyConfig();
  record('proxy-clear', pc.readProxyConfig() === null, JSON.stringify(pc.readProxyConfig()), 'null（已 clear）', '');
} catch (e) {
  results.push({ id: '__EXCEPTION__', pass: false, actual: e && e.message, expected: 'no throw', why: 'probe 异常' });
}

const allPass = results.length > 0 && results.every(r => r.pass);
const status = allPass ? 'PASS' : 'FAIL';
const why = results.filter(r => !r.pass).map(r => `${r.id}:${r.why || (r.actual + '!=' + r.expected)}`).join('; ');
const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL(`file://${process.cwd()}/D1-70/stdout.log`), JSON.stringify(obj, null, 2), 'utf8');
console.log('D1-70 => ' + status + ' ' + (why || ''));