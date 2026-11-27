// Real probe for D2-27: KooCLI 版本管理
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const kv = await import('file:///' + DIST + '/koocli-version.js');
  const ver = kv.getKooCliVersion();
  const parsed = kv.parseHcloudVersion('hcloud 7.2.12 (windows/amd64)');
  const cmp = kv.compareVersion('7.2.12', '7.2.9');
  const base = kv.kooCliDownloadBase('7.2.12');
  const baseOk = String(base).startsWith(kv.KOO_CLI_BASE) && /\d+\.\d+\.\d+/.test(String(base));
  const ok = parsed === '7.2.12' && cmp === 1 && baseOk;
  return { status: ok ? 'PASS' : 'FAIL', why: 'getKooCliVersion=' + JSON.stringify(ver) + '，parse=' + parsed + '，compare=' + cmp + '，base=' + base, result: { ver, parsed, cmp, base, baseOk } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
