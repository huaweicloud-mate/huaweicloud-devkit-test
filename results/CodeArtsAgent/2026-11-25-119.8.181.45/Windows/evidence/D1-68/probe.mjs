// Real probe for D1-68: ???????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const icon = await import('file:///' + DIST + '/icon-library.mjs');
  const offline = await icon.getServiceIcon('ecs', { offline: true });
  const cred = await import('file:///' + DIST + '/auth/credentials.mjs');
  const envRegion = cred.resolveCredentials ? cred.resolveCredentials({ ...process.env, HUAWEICLOUD_REGION: 'cn-east-3', HW_REGION: 'cn-north-4' }) : null;
  const ok = !!offline && /ecs/i.test(JSON.stringify(offline));
  return { status: ok ? 'PASS' : 'FAIL', why: '??????=' + JSON.stringify(offline).slice(0, 200) + '?HUAWEICLOUD_REGION ?????=' + JSON.stringify(envRegion && envRegion.region), result: { offline, envRegion } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
