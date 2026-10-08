// D1-70: 代理配置与WebSocket代理
// Test proxy-config functions: writeProxyConfig, readProxyConfig, getProxySettings, shouldBypassProxy
import { pathToFileURL } from 'node:url';
const { writeProxyConfig, readProxyConfig, getProxySettings, shouldBypassProxy, clearProxyConfig, proxyConfigPath } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/proxy/proxy-config.mjs').href);

try {
  // Test 1: Write and read proxy config
  const testConfig = { https_proxy: 'http://proxy.example.com:8080', http_proxy: 'http://proxy.example.com:8080', no_proxy: 'localhost,127.0.0.1,*.internal' };
  const writtenPath = writeProxyConfig(testConfig);
  const readBack = readProxyConfig();
  const writeReadOk = readBack.https_proxy === testConfig.https_proxy &&
                      readBack.http_proxy === testConfig.http_proxy &&
                      readBack.no_proxy === testConfig.no_proxy;

  // Test 2: shouldBypassProxy - localhost should bypass
  const bypassLocalhost = shouldBypassProxy('localhost', ['localhost', '127.0.0.1']);
  const bypassInternal = shouldBypassProxy('api.internal', ['*.internal']);
  const noBypassExternal = shouldBypassProxy('api.huaweicloud.com', ['localhost', '127.0.0.1']);
  const bypassOk = bypassLocalhost === true && bypassInternal === true && noBypassExternal === false;

  // Test 3: getProxySettings with env override
  const oldHttpsProxy = process.env.HTTPS_PROXY;
  process.env.HTTPS_PROXY = 'http://env-proxy:3128';
  const settings = getProxySettings('https://api.huaweicloud.com');
  const envOverrideOk = settings !== null && settings.proxyUrl === 'http://env-proxy:3128';
  process.env.HTTPS_PROXY = oldHttpsProxy;

  // Cleanup
  clearProxyConfig();

  const pass = writeReadOk && bypassOk && envOverrideOk;
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D1-70',
    why: pass
      ? `write/read config OK, bypass proxy OK (localhost+internal bypass, external no bypass), env override OK`
      : `writeReadOk=${writeReadOk}, bypassOk=${bypassOk}, envOverrideOk=${envOverrideOk}`,
    executedAt: '20261001103000',
    detail: { writtenPath, readBack, bypassLocalhost, bypassInternal, noBypassExternal, settings },
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = {
    status: 'FAIL',
    caseId: 'D1-70',
    why: `proxy config test threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}