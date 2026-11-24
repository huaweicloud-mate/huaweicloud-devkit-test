// Real probe for D4-15: hook????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const variants = ['hcloud ECS DELETESERVERS --server_id=x', 'hcloud ECS DeleteServers%20--server_id=x', 'hcloud ECS "Delete""Servers" --server_id=x', 'hcloud ECS DeleteServers --server_id=x; hcloud KMS DecryptData --cipher_text=abc'];
    const out = [];
    for (const v of variants) { const r = await mcpTool('huaweicloud_hook_check_command', { command: v }, 45000); out.push({ v, decision: (r.parsed && r.parsed.decision) || 'none', rules: (r.parsed && r.parsed.findings || []).map((f) => f.ruleId) }); }
    const bypass = out.some((x) => x.decision === 'allow' || x.decision === 'none');
    return { status: bypass ? 'FAIL' : 'PASS', why: bypass ? '????????: ' + JSON.stringify(out.filter((x) => x.decision === 'allow' || x.decision === 'none')) : '????????????', result: out };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
