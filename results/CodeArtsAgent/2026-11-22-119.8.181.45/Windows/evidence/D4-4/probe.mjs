// Real probe for D4-4: 四类写操作预检 deny
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const cmds = [['ECS','CreateServers'],['VPC','DeleteVpc','--vpc_id=abc'],['RDS','DeleteInstance','--instance_id=abc'],['EIP','DeletePublicip','--publicip_id=abc']];
  const out = [];
  for (const a of cmds) { const r = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: a, allowWrites: false }, 45000); const p = r.parsed || {}; out.push({ cmd: a.join(' '), decision: p.classification && p.classification.decision, safeToRun: p.safeToRun, token: !!p.approvalToken }); }
  const ok = out.every((x) => x.decision === 'deny' && x.safeToRun === false && x.token);
  return { status: ok ? 'PASS' : 'FAIL', why: '四类写操作均 deny+safeToRun=false+approvalToken：' + out.map((x) => x.cmd + '=' + x.decision).join(', '), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
