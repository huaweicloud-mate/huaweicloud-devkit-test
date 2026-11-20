// Real probe for D4-26: findings 证据脱敏
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud CSMS ShowSecretVersion --secret_name=x --secret_string=SK_TEST_PLACEHOLDER_LEAK_VALUE' }, 45000);
  const txt = JSON.stringify(r.parsed || {});
  const leaked = /SK_TEST_PLACEHOLDER_LEAK_VALUE/.test(txt);
  const ok = !leaked && /redacted/i.test(txt);
  return { status: ok ? 'PASS' : 'FAIL', why: 'findings 含明文=' + leaked + ' 含redacted占位=' + /redacted/i.test(txt), result: r.parsed };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
