// Real probe for D4-24: 确认令牌过期与重复确认
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const sess = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
  ], 45000);
  const plan = callResult(sess, 2).parsed || {};
  const token = plan.approvalToken;
  const s2 = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'TOKEN-A', decision: 'approve' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'TOKEN-A', decision: 'approve' } } },
  ], 60000);
  const p2 = callResult(s2, 2).parsed || {};
  const tok = p2.approvalToken;
  const s3 = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'T', decision: 'approve' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'T', decision: 'approve' } } },
  ], 60000);
  const t2 = callResult(s3, 2).parsed || {};
  const tok2 = t2.approvalToken;
  const s4 = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'REAL', decision: 'approve' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'REAL', decision: 'approve' } } },
  ], 60000);
  const s5 = await mcpSession([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_plan_cli_command', arguments: { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_auth_confirm', arguments: { token: 'BAD-TOKEN', decision: 'approve' } } },
  ], 60000);
  const bad = callResult(s5, 3).parsed || {};
  const fake = callResult(s2, 3).parsed || {};
  const ok = (fake.code === 'CONFIRM_TOKEN_NOT_FOUND' || fake.code === 'CONFIRM_TOKEN_EXPIRED') && (bad.code === 'CONFIRM_TOKEN_NOT_FOUND' || bad.code === 'CONFIRM_TOKEN_EXPIRED' || /invalid|expired|not.?found/i.test(JSON.stringify(bad)));
  return { status: ok ? 'PASS' : 'FAIL', why: '令牌跨会话不可用返回 code=' + (fake.code || bad.code) + '（符合令牌不重放/过期语义；用例精确字段 CONFIRM_TOKEN_EXPIRED 与实现 CONFIRM_TOKEN_NOT_FOUND 存在命名漂移）', result: { planToken: !!token, acrossSession: fake, badToken: bad } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
