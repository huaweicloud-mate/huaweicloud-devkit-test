// Real probe for D2-27: KooCLI 版本解析
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const kv = await import('file:///' + DIST + '/koocli-version.mjs');
  const ver = kv.getKooCliVersion();
  const parsed = kv.parseHcloudVersion('hcloud 7.2.12 (windows/amd64)');
  const cmp = kv.compareVersion('7.2.12', '7.2.9');
  const base = kv.kooCliDownloadBase();
  const ok = parsed === '7.2.12' && cmp === 1 && String(base).includes(String(ver || 'latest'));
  return { status: ok ? 'PASS' : 'FAIL', why: 'getKooCliVersion=' + ver + ' parse=' + parsed + ' compare=' + cmp + ' base=' + base, result: { ver, parsed, cmp, base } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
