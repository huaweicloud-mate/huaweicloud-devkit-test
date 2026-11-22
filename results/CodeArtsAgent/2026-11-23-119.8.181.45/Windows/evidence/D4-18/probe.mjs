// Real probe for D4-18: confirm-not-deny????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const r = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 60000);
    const p = r.parsed || {};
    const ok = p.classification && p.classification.decision === 'deny' + '' && p.userConfirmation && p.userConfirmation.needed === true && !!p.approvalToken && p.safeToRun === false;
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '????? deny+approvalToken+userConfirmation.needed=true????????????/?????' : '??????: ' + JSON.stringify(p).slice(0, 400), result: p };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
