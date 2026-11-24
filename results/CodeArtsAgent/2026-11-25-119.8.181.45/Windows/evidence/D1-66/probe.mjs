// Real probe for D1-66: 遥测开关与端点环境变量
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const old = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const a = tel.isTelemetryEnabled();
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
  const b = tel.isTelemetryEnabled();
  if (old === undefined) delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY; else process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = old;
  const c = tel.isTelemetryEnabled();
  const ok = a === false && b === true && c === true;
  return { status: ok ? 'PASS' : 'FAIL', why: 'TELEMETRY=off -> ' + a + '；=on -> ' + b + '；未设 -> ' + c, result: { off: a, on: b, unset: c } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
