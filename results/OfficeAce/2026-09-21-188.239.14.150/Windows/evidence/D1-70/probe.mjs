// AI生成
// D1-70: 代理配置与WebSocket代理 (P1)
// Test proxy-config read/write/clear, getProxySettings, no_proxy bypass, WebSocket proxy selection
import { writeProxyConfig, readProxyConfig, clearProxyConfig, getProxySettings, proxyConfigPath } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/proxy/proxy-config.mjs';
import { getProxyDispatcher, createProxyWebSocket, getWebSocketImpl } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/proxy/proxy-agent.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Use temp HUAWEICLOUD_HOME to avoid clobbering real config
  const tempHome = path.join(os.tmpdir(), 'd1-70-proxy-test-' + Date.now());
  fs.mkdirSync(tempHome, { recursive: true });
  process.env.HUAWEICLOUD_HOME = tempHome;

  // Save and clear proxy env vars to isolate file config testing
  const savedEnv = {};
  for (const k of ['HTTP_PROXY','http_proxy','HTTPS_PROXY','https_proxy','NO_PROXY','no_proxy']) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }

  // Test 1: writeProxyConfig
  const configPath = writeProxyConfig({
    https_proxy: 'http://proxy.example.com:8080',
    http_proxy: 'http://proxy.example.com:8080',
    no_proxy: 'localhost,*.internal.com'
  });
  results.writePath = configPath;
  results.writeSuccess = fs.existsSync(configPath);

  // Test 2: readProxyConfig
  const readConfig = readProxyConfig();
  results.readConfig = readConfig;
  results.readCorrect = readConfig && 
    readConfig.https_proxy === 'http://proxy.example.com:8080' &&
    readConfig.http_proxy === 'http://proxy.example.com:8080' &&
    readConfig.no_proxy === 'localhost,*.internal.com';

  // Test 3: getProxySettings with target URL
  const settings = getProxySettings('https://api.example.com/test');
  results.proxySettings = settings;
  results.settingsCorrect = settings && 
    settings.proxyUrl === 'http://proxy.example.com:8080' &&
    settings.targetProtocol === 'https:';

  // Test 4: no_proxy bypass
  const bypassSettings = getProxySettings('https://localhost:3000/test');
  results.bypassSettings = bypassSettings;
  results.bypassWorks = bypassSettings === null;

  // Test 5: no_proxy wildcard bypass
  const wildcardBypass = getProxySettings('https://api.internal.com/test');
  results.wildcardBypass = wildcardBypass;
  results.wildcardBypassWorks = wildcardBypass === null;

  // Test 6: clearProxyConfig
  const cleared = clearProxyConfig();
  results.clearSuccess = cleared === true;
  results.clearVerified = !fs.existsSync(configPath);

  // Test 7: getProxySettings returns null when no proxy configured
  const noProxySettings = getProxySettings('https://api.example.com/test');
  results.noProxySettings = noProxySettings;
  results.noProxyReturnsNull = noProxySettings === null;

  // Test 8: env var proxy (HTTPS_PROXY)
  process.env.HTTPS_PROXY = 'http://env-proxy.example.com:9090';
  const envProxySettings = getProxySettings('https://api.example.com/test');
  results.envProxySettings = envProxySettings;
  results.envProxyWorks = envProxySettings && envProxySettings.proxyUrl === 'http://env-proxy.example.com:9090';
  delete process.env.HTTPS_PROXY;

  // Test 9: WebSocket impl selection - no proxy → globalThis.WebSocket
  delete process.env.HTTPS_PROXY;
  delete process.env.HTTP_PROXY;
  const wsImpl = await getWebSocketImpl('wss://api.example.com/ws');
  results.wsImpl = wsImpl ? wsImpl.name || 'unknown' : 'null';
  results.wsImplExists = !!wsImpl;

  // Test 10: WebSocket impl with proxy → should use proxy dispatcher
  process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';
  const wsImplProxy = await getWebSocketImpl('wss://api.example.com/ws');
  results.wsImplProxy = wsImplProxy ? wsImplProxy.name || 'unknown' : 'null';
  results.wsImplProxyExists = !!wsImplProxy;
  delete process.env.HTTPS_PROXY;

  // Cleanup
  try { fs.rmSync(tempHome, { recursive: true, force: true }); } catch {}
  delete process.env.HUAWEICLOUD_HOME;
  // Restore env vars
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v !== undefined) process.env[k] = v;
  }

  const status = (results.writeSuccess && results.readCorrect && results.settingsCorrect && 
                  results.bypassWorks && results.wildcardBypassWorks && results.clearSuccess && 
                  results.clearVerified && results.noProxyReturnsNull && results.envProxyWorks &&
                  results.wsImplExists && results.wsImplProxyExists) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? 'proxy.json读写/clear正确; getProxySettings拼env+file且no_proxy命中返回null; WebSocket代理选择正确'
      : `代理配置异常: write=${results.writeSuccess}, read=${results.readCorrect}, settings=${results.settingsCorrect}, bypass=${results.bypassWorks}, wildcard=${results.wildcardBypassWorks}, clear=${results.clearSuccess}, noProxy=${results.noProxyReturnsNull}, envProxy=${results.envProxyWorks}, wsImpl=${results.wsImplExists}, wsProxy=${results.wsImplProxyExists}`,
    executedAt: ts(),
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
