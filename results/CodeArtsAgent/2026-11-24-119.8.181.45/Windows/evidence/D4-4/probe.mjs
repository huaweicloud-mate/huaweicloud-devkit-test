// Real probe for D4-4: 写操作审批门
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const writes = [['ECS', 'CreateServers'], ['VPC', 'DeleteVpc'], ['RDS', 'DeleteInstance'], ['EIP', 'DeletePublicip']];
  const out = [];
  for (const args of writes) {
    const r = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: [...args, '--dry'], allowWrites: false }, 45000);
    const c = (r.parsed && r.parsed.classification) || {};
    out.push({ op: args.join('.'), decision: c.decision, risk: c.risk, safeToRun: r.parsed && r.parsed.safeToRun, token: !!(r.parsed && r.parsed.approvalToken) });
  }
  const ok = out.every((x) => x.decision === 'deny' && x.safeToRun === false && x.token);
  return { status: ok ? 'PASS' : 'FAIL', why: '四类写操作均 deny+safeToRun=false+approvalToken：' + out.map((x) => x.op + '=' + x.decision).join(', '), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
