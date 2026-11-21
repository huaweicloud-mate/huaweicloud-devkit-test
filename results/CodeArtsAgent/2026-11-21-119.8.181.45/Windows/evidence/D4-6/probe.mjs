// Real probe for D4-6: adminPass 回显警告与脱敏
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const s1 = sp.redactSecrets('create ECS adminPass=MySecret123! region=cn-north-4');
  const out = hc.redactOutput('password: MySecret123! accessKeyId: AK_TEST_PLACEHOLDER_VALUE secretAccessKey: SK_TEST_PLACEHOLDER_VALUE_0000');
  const ok = !s1.includes('MySecret123!') && s1.includes('<redacted>') && !/MySecret123!|SK_TEST_PLACEHOLDER_VALUE_0000/.test(out);
  return { status: ok ? 'PASS' : 'FAIL', why: 'adminPass= 已脱敏=' + !s1.includes('MySecret123!') + '；CLI回显密码/SK已脱敏=' + !/MySecret123!|SK_TEST_PLACEHOLDER_VALUE_0000/.test(out) + '；注：JSON字符串键形式 adminPass 后接引号未命中（潜在改进点）', result: { s1, out } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
