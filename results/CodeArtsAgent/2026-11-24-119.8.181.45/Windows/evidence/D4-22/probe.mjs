// Real probe for D4-22: hook_check_deploy_plan ????????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
    const r = await mcpTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', cleanup: false, resources: [{ type: 'FunctionGraph', name: 'fn1' }] } }, 45000);
    const ok = ['deny', 'warn'].includes((r.parsed && r.parsed.decision) || '') && (r.parsed.findings || []).some((f) => f.category === 'public_exposure');
    return { status: ok ? 'PASS' : 'FAIL', why: 'decision=' + (r.parsed && r.parsed.decision) + ' rules=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
