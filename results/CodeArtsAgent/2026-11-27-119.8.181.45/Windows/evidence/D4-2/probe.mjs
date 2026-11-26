// Real probe for D4-2: ??env????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
    const r = await mcpTool('huaweicloud_hook_check_command', { command: 'set HW_SECRET_KEY' }, 45000);
    const d = r.parsed && r.parsed.decision;
    return { status: d === 'deny' ? 'PASS' : 'FAIL', why: 'decision=' + d + ' findings=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
