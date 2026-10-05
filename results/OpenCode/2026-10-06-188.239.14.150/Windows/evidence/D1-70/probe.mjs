// D1-70 代理配置与 WebSocket 代理（P1）
// 断言：隔离 HOME 下 proxy.json 写入/读取/clear 正确；getProxySettings 优先 env 再回落文件；
//       no_proxy 命中返回 null；shouldBypassProxy 判定正确
import { writeFileSync, mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const SERVER = join(SRC, 'mcp-server.mjs');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const tmp = mkdtempSync(join(tmpdir(), 'd1-70-'));
process.env.HUAWEICLOUD_HOME = tmp;
const PC = await import(pathToFileURL(join(SRC, 'proxy', 'proxy-config.mjs')).href);
for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']) delete process.env[k];

const cfg = { http_proxy: 'http://127.0.0.1:18080', https_proxy: 'http://127.0.0.1:18080', no_proxy: 'localhost,127.0.0.1,.internal.example.com' };
const cfgPath = PC.writeProxyConfig(cfg);
const fileExists = existsSync(cfgPath);
const readBack = PC.readProxyConfig();
const roundTrip = !!readBack
  && String(readBack.https_proxy || '') === cfg.https_proxy
  && String(readBack.http_proxy || '') === cfg.http_proxy
  && String(readBack.no_proxy || '') === cfg.no_proxy;

const withProxy = PC.getProxySettings('https://api.huaweicloud.com/v3/ecs');
const bypassSuffix = PC.getProxySettings('https://svc.internal.example.com/v3');
const bypassLocal = PC.getProxySettings('http://localhost:8080/x');
const bypassIp = PC.getProxySettings('http://127.0.0.1:9000');
const bypassDirect = PC.shouldBypassProxy('db.internal.example.com', ['.internal.example.com']);
const notBypass = PC.shouldBypassProxy('api.huaweicloud.com', ['localhost']);

process.env.HTTPS_PROXY = 'http://127.0.0.1:19999';
const envWins = PC.getProxySettings('https://api.huaweicloud.com/v3');
delete process.env.HTTPS_PROXY;

PC.clearProxyConfig();
const cleared = !existsSync(cfgPath) || PC.readProxyConfig() === null;
const fileAfterClear = existsSync(cfgPath) ? readFileSync(cfgPath, 'utf8') : null;

const rows = [
  { id: 'proxy.json 写入到隔离 HOME', ok: fileExists, actual: cfgPath },
  { id: 'readProxyConfig 往返一致', ok: !!roundTrip, actual: readBack },
  { id: 'getProxySettings 命中代理', ok: !!(withProxy && (withProxy.proxyUrl || withProxy.https_proxy || withProxy.proxy)), actual: withProxy },
  { id: 'no_proxy 域名后缀绕过返回 null', ok: bypassSuffix === null, actual: bypassSuffix },
  { id: 'no_proxy localhost 绕过返回 null', ok: bypassLocal === null, actual: bypassLocal },
  { id: 'no_proxy 127.0.0.1 绕过返回 null', ok: bypassIp === null, actual: bypassIp },
  { id: 'shouldBypassProxy 后缀匹配为 true', ok: bypassDirect === true, actual: bypassDirect },
  { id: 'shouldBypassProxy 非命中为 false', ok: notBypass === false, actual: notBypass },
  { id: 'env 代理优先于文件配置', ok: !!(envWins && JSON.stringify(envWins).includes('19999')), actual: envWins },
  { id: 'clearProxyConfig 清除配置', ok: !!cleared, actual: { cleared, fileAfterClear } },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `代理配置链路成立：隔离 HOME 下 proxy.json 写入/读取/clear 全部正确；getProxySettings 命中代理并按 no_proxy 对 localhost/127.0.0.1/域名后缀三类目标返回 null；env 代理优先于文件配置`
      : `代理配置断言不成立：${JSON.stringify(violations)}`,
  { cfgPath, fileExists, readBack, withProxy, bypassSuffix, bypassLocal, bypassIp, bypassDirect, notBypass, envWins, cleared, rows, violations });
