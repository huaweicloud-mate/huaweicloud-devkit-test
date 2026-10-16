import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
// D1-70: Proxy config — writeProxyConfig/readProxyConfig/getProxySettings
const caseId = 'D1-70';
const executedAt = '20261017061700';
try {
  // Find proxy-config module
  let proxyMod;
  try {
    proxyMod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/proxy/proxy-config.mjs');
  } catch {
    // Try alternate path
    const { readdirSync } = await import('node:fs');
    const proxyDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/proxy';
    const files = readdirSync(proxyDir);
    for (const f of files) {
      if (f.endsWith('.mjs')) {
        try {
          proxyMod = await import('file:///' + proxyDir.replace(/\\/g, '/') + '/' + f);
          if (proxyMod.getProxySettings || proxyMod.writeProxyConfig) break;
        } catch {}
      }
    }
  }
  const hasWriteProxy = typeof proxyMod?.writeProxyConfig === 'function';
  const hasReadProxy = typeof proxyMod?.readProxyConfig === 'function';
  const hasGetProxy = typeof proxyMod?.getProxySettings === 'function';
  // Test getProxySettings with no proxy env → should return null or empty
  let proxySettings = null;
  if (hasGetProxy) {
    proxySettings = proxyMod.getProxySettings('https://example.com');
  }
  // Test no_proxy bypass
  let noProxyResult = null;
  if (hasGetProxy) {
    noProxyResult = proxyMod.getProxySettings('https://localhost');
  }
  const status = (hasWriteProxy && hasReadProxy && hasGetProxy) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'writeProxyConfig=' + hasWriteProxy + ', readProxyConfig=' + hasReadProxy + ', getProxySettings=' + hasGetProxy + '; proxySettings=' + JSON.stringify(proxySettings)?.slice(0, 100) + '; noProxyResult=' + JSON.stringify(noProxyResult)?.slice(0, 100), executedAt, result: { hasWriteProxy, hasReadProxy, hasGetProxy, proxySettings, noProxyResult } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
