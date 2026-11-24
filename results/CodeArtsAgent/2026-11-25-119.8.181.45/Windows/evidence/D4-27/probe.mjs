// Real probe for D4-27: 双路径输出脱敏
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const text = 'AK_TEST_PLACEHOLDER_VALUE SK_TEST_PLACEHOLDER_VALUE_0000 token=abc123 region=cn-north-4 name=vm1';
  const a = sp.redactSecrets(text);
  const b = hc.redactOutput(text);
  const ok = !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|abc123/.test(a) && !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|abc123/.test(b) && a.includes('cn-north-4') && a.includes('vm1');
  return { status: ok ? 'PASS' : 'FAIL', why: 'redactSecrets 脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000/.test(a) + ' redactOutput 脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000/.test(b) + ' 非敏感字段保留=' + (a.includes('cn-north-4') && a.includes('vm1')), result: { a, b } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
