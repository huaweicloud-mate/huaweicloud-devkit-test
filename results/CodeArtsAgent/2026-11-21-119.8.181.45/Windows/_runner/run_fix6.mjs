import { mcpTool, writeEvidence, writeProbe, VC_QUOTE } from './lib.mjs';
const fn = async () => {
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
const r = await fn();
writeEvidence('D4-4', r);
writeProbe('D4-4', '写操作审批门', fn);
console.log('D4-4', r.status, '|', r.why);
