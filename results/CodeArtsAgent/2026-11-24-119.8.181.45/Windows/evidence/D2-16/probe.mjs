// Real probe for D2-16: import???????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, writeFileSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d216');
  const f = join(h, '.config', 'huaweicloud', 'creds-import.json');
  writeFileSync(f, JSON.stringify({ ak: 'AK_IMPORT_0000000', sk: 'SK_IMPORT_000000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  const r = await mcpTool('huaweicloud_auth_switch', { vendorConfirmed: VC_QUOTE, mode: 'import', action: 'temporary' }, 60000, { USERPROFILE: h, HOME: h });
  return { status: !existsSync(f) ? 'PASS' : 'FAIL', why: 'import ??????=' + !existsSync(f) + '???=' + (r.text || '').slice(0, 220), result: { fileExists: existsSync(f), resp: r.parsed || r.text } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
