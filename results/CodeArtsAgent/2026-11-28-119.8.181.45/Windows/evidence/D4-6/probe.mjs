// Real probe for D4-6: adminPass 回显警告与脱敏
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, ENV } from '../../_runner/lib.mjs';
const run = async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const s1 = sp.redactSecrets('create ECS adminPass=MySecret123! region=cn-north-4');
  const s2 = sp.redactSecrets('{"adminPass":"MySecret123!","name":"vm"}');
  const out = hc.redactOutput('password: MySecret123! accessKeyId: AK0123456789 secretAccessKey: SK0123456789');
  const ok = !s1.includes('MySecret123!') && !s2.includes('MySecret123!') && !/MySecret123!|SK0123456789|AK0123456789/.test(out);
  return { status: ok ? 'PASS' : 'FAIL', why: 'adminPass 脱敏后不含明文=' + ok, result: { s1, s2, out } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
