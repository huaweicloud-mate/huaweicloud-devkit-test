// Real probe for D4-21: hook_check_artifacts ???????/IaC/???????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const r = await mcpTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'iam-policy.json', content: JSON.stringify({ Version: '1.1', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }) }] }, 45000);
    const ok = (r.parsed && r.parsed.decision) === 'deny' && (r.parsed.findings || []).some((f) => f.ruleId === 'hwc-iam-admin-policy');
    return { status: ok ? 'PASS' : 'FAIL', why: 'decision=' + (r.parsed && r.parsed.decision) + ' rules=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
