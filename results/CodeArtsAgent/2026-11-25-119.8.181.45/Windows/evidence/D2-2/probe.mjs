// Real probe for D2-2: auth status?????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, writeFileSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d22');
  const a = await mcpTool('huaweicloud_auth_status', { vendorConfirmed: VC_QUOTE }, 45000, { USERPROFILE: h, HOME: h });
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  writeFileSync(s1, JSON.stringify({ ak: 'AKTESTD220000000000', sk: 'SKTESTD2200000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  const b = await mcpTool('huaweicloud_auth_status', { vendorConfirmed: VC_QUOTE }, 45000, { USERPROFILE: h, HOME: h });
  const p1 = a.parsed || {}, p2 = b.parsed || {};
  const ok = !!(p1 && p2) && JSON.stringify(p1) !== JSON.stringify(p2);
  return { status: ok ? 'PASS' : 'FAIL', why: '??? vs ?S1 ????=' + (JSON.stringify(p1) !== JSON.stringify(p2)), result: { empty: p1, withS1: p2 } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
