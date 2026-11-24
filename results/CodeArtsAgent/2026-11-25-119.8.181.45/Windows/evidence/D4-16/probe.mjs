// Real probe for D4-16: ??????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const variants = ['cmd /c hcloud ECS DeleteServers --server_id=x', 'sh -c "hcloud ECS DeleteServers --server_id=x"', 'powershell -Command "hcloud KMS DecryptData --cipher_text=abc"', 'echo $(hcloud CSMS ShowSecretVersion --secret_name=x)'];
    const out = [];
    for (const v of variants) { const r = await mcpTool('huaweicloud_hook_check_command', { command: v }, 45000); out.push({ v, decision: (r.parsed && r.parsed.decision) || 'none', rules: (r.parsed && r.parsed.findings || []).map((f) => f.ruleId) }); }
    const bypass = out.some((x) => x.decision === 'allow' || x.decision === 'none');
    return { status: bypass ? 'FAIL' : 'PASS', why: bypass ? '??????????' : '???????????', result: out };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
