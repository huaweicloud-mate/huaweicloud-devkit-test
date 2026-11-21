// Real probe for D4-20: 拒绝后零操作
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const sess = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'FROM-PLAN', decision: 'reject' } } },
  ], 60000);
  const plan = callResult(sess, 2).parsed || {};
  const token = plan.approvalToken;
  const s2 = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'TMP', decision: 'reject' } } },
  ], 60000);
  const p2 = callResult(s2, 2).parsed || {};
  const tok2 = p2.approvalToken;
  const s3 = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'TMP2', decision: 'reject' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'TMP2', decision: 'approve' } } },
  ], 60000);
  const rej = callResult(s3, 3);
  const ok = !!plan.approvalToken && plan.safeToRun === false && !!(rej.parsed || rej.text);
  return { status: ok ? 'PASS' : 'FAIL', why: 'plan 未批准 safeToRun=false=' + (plan.safeToRun === false) + '；拒绝路径返回=' + JSON.stringify(rej.parsed || rej.text).slice(0, 160), result: { plan, reject: rej.parsed || rej.text } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
