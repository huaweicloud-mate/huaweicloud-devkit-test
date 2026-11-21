// Real probe for D8-9: 安装 ID 与遥测值脱敏
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const id1 = tel.generateOrRecoverInstallId();
  const id2 = tel.generateOrRecoverInstallId();
  const s = tel.sanitizeValue('ak=AK_TEST_PLACEHOLDER_VALUE token=secret-token-123 name=ok-value bad=a\nb');
  const st = String(s);
  const ok = !!id1 && id1 === id2 && !/AK_TEST_PLACEHOLDER_VALUE|secret-token-123/.test(st) && /ok-value/.test(st);
  return { status: ok ? 'PASS' : 'FAIL', why: 'installId 稳定=' + (!!id1 && id1 === id2) + ' 敏感值已脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|secret-token-123/.test(st) + ' 合法值保留=' + /ok-value/.test(st), result: { id1, id2, sanitized: s } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
