// Real probe for D1-41: check_update ?? MCP ????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d141');
  const r = await mcpTool('huaweicloud_check_update', {}, 60000, { USERPROFILE: h, HOME: h });
  const p = r.parsed || {};
  const fields = ['currentVersion', 'latestStable', 'latestNext', 'targetVersion', 'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result'];
  const allFields = fields.every((f) => f in p);
  const ok = !r.isError && allFields && typeof p.result === 'string';
  return { status: ok ? 'PASS' : 'FAIL', why: 'isError=' + r.isError + ' ????=' + allFields + ' result=' + p.result + '??????', result: p };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
