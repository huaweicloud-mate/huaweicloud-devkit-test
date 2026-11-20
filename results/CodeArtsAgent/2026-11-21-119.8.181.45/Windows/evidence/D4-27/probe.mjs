// Real probe for D4-27: 双路径输出脱敏
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const obj = { accessKeyId: 'AK_TEST_PLACEHOLDER_VALUE', secretAccessKey: 'SK_TEST_PLACEHOLDER_VALUE_0000', securityToken: 'token-abc-123', region: 'cn-north-4', name: 'vm1' };
  const a = sp.redactSecrets(obj);
  const b = JSON.parse(hc.redactOutput(JSON.stringify(obj)));
  const bad = (x) => /AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|token-abc-123/.test(JSON.stringify(x));
  const ok = !bad(a) && !bad(b) && a.region === 'cn-north-4' && a.name === 'vm1' && b.region === 'cn-north-4' && b.name === 'vm1';
  return { status: ok ? 'PASS' : 'FAIL', why: 'redactSecrets 脱敏=' + !bad(a) + ' redactOutput 脱敏=' + !bad(b) + ' 非敏感字段保留=' + (a.region === 'cn-north-4' && a.name === 'vm1'), result: { a, b } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
