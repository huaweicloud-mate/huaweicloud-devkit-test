// Real probe for D9-13: tools/call ??????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const os = await import('node:os');
    const fs = await import('node:fs');
    const tmp = join(os.tmpdir(), 'hdk-iso-d913-' + Date.now());
    fs.mkdirSync(tmp, { recursive: true });
    const cred = await import('file:///' + DIST + '/auth/credentials.js');
    cred.setRuntimeCredentials({ ak: 'AKID_D913_1234567890', sk: 'SK_D913_SECRET_abcdefghij', region: 'cn-north-4' });
    const has = cred.hasRuntimeCredentials();
    const resolved = cred.resolveCredentialsWithRuntime ? !!cred.resolveCredentialsWithRuntime() : null;
    cred.clearRuntimeCredentials();
    const afterClear = cred.hasRuntimeCredentials();
    const prof = await mcpTool('huaweicloud_show_profile_redacted', { vendorConfirmed: VC_QUOTE }, 60000);
    const text = JSON.stringify(prof.parsed || prof.text || '');
    const noLeak = !/AKID_D913|SK_D913_SECRET|secretAccessKey"\s*:\s*"(?!<redacted>)/.test(text);
    const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'DeleteServers', '--server_id=x'], allowWrites: false }, 60000);
    const token = plan.parsed && plan.parsed.approvalToken;
    const c1 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
    const c2 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
    const replayBlocked = !!(c1.ok !== undefined) && !(c2.parsed && c2.parsed.ok === true && c2.parsed.status === 'approved');
    const ok = has === true && afterClear === false && noLeak && !!token && replayBlocked;
    return { status: ok ? 'PASS' : 'FAIL', why: 'runtimeSet=' + has + ' cleared=' + (afterClear === false) + ' noLeak=' + noLeak + ' tokenIssued=' + !!token + ' replayBlocked=' + replayBlocked, result: { has, afterClear, resolved, noLeak, token: token ? token.slice(0, 8) + '...' : null, confirm1: c1.parsed || c1.text, confirm2: c2.parsed || c2.text } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
