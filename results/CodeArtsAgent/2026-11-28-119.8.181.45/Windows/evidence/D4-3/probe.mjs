// Real probe for D4-3: ??secret API??
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const a = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud KMS DecryptData --cipher_text=abc' }, 45000);
    const b = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud CSMS ShowSecretVersion --secret_name=x' }, 45000);
    const ok = (a.parsed && a.parsed.decision) === 'deny' && (b.parsed && b.parsed.decision) === 'deny';
    return { status: ok ? 'PASS' : 'FAIL', why: 'KMS=' + (a.parsed && a.parsed.decision) + ' CSMS=' + (b.parsed && b.parsed.decision), result: { kms: a.parsed, csms: b.parsed } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
