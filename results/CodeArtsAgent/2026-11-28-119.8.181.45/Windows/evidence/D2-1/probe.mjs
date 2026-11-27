// Real probe for D2-1: auth init????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d21');
  const r = await mcpTool('huaweicloud_auth_init', { vendorConfirmed: VC_QUOTE, ak: 'AKTESTD210000000000', sk: 'SKTESTD2100000000000000000000000000', region: 'cn-north-4' }, 90000, { USERPROFILE: h, HOME: h });
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  const koo = join(h, '.hcloud', 'config.json');
  const obs = join(h, '.obsutil', 'config');
  const files = { s1: existsSync(s1), koo: existsSync(koo), obs: existsSync(obs) };
  const ok = files.s1;
  return { status: ok ? 'PASS' : 'FAIL', why: '?? HOME ? S1=' + files.s1 + ' KooCLI=' + files.koo + ' OBS=' + files.obs + '???=' + (r.text || '').slice(0, 220), result: { files, resp: r.parsed || r.text } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
