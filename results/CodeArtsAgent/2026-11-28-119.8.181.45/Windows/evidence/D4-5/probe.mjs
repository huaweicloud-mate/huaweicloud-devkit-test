// Real probe for D4-5: ???????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const w = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'DeleteServers', '--server_id=abc'], allowWrites: false }, 60000);
    const rd = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails'], allowWrites: false }, 60000);
    const wr = (w.parsed && w.parsed.classification) || {};
    const rr = (rd.parsed && rd.parsed.classification) || {};
    const ok = wr.risk === 'write' && wr.decision !== 'allow' && rr.risk === 'read_only' && rr.decision === 'allow';
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? 'DeleteServers?write(deny)?ListServersDetails?read_only(allow)' : '????: write=' + JSON.stringify(wr) + ' read=' + JSON.stringify(rr), result: { write: wr, read: rr } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
