// Real probe for D1-70: ????? WebSocket ??
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d170');
  const px = await import('file:///' + DIST + '/proxy/proxy-config.mjs');
  px.writeProxyConfig({ https_proxy: 'http://127.0.0.1:8080', no_proxy: 'localhost,127.0.0.1' }, { home: h });
  const rd = px.readProxyConfig({ home: h });
  const hit = px.getProxySettings ? px.getProxySettings('https://iam.cn-north-4.myhuaweicloud.com', { home: h, env: {} }) : null;
  const bypass = px.getProxySettings ? px.getProxySettings('http://localhost:3000', { home: h, env: {} }) : null;
  px.clearProxyConfig && px.clearProxyConfig({ home: h });
  const ok = !!rd && !!hit && bypass === null;
  return { status: ok ? 'PASS' : 'FAIL', why: 'proxy.json ??=' + !!rd + ' ????=' + JSON.stringify(hit) + ' no_proxy ??=' + JSON.stringify(bypass), result: { read: rd, hit, bypass } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
