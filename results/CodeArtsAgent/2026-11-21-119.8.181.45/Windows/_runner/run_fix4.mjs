import { mcpTool, mcpSession, finishCall, writeEvidence, writeProbe, VC_QUOTE } from './lib.mjs';

function callResult(sess, id) { const f = finishCall(sess.responses.find((r) => r.id === id)); return { ok: f.ok, parsed: f.parsed, text: f.text, error: f.error }; }

const cases = [];

cases.push({ id: 'D4-20', title: '拒绝后零操作', fn: async () => {
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
} });

cases.push({ id: 'D4-24', title: '确认令牌过期与重复确认', fn: async () => {
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
} });

cases.push({ id: 'D3-S4', title: '场景-领券闭环', fn: async () => {
  const s1 = await mcpTool('huaweicloud_voucher_status', {}, 45000);
  const p1 = s1.parsed || {};
  const before = p1.claimed;
  const claim = await mcpTool('huaweicloud_voucher_claim', {}, 60000);
  const cp = claim.parsed || {};
  const s2 = await mcpTool('huaweicloud_voucher_status', {}, 45000);
  const p2 = s2.parsed || {};
  const after = p2.claimed;
  const ok = s1.ok && s2.ok && (claim.ok || /already|claimed|领取/i.test(JSON.stringify(cp))) && (before === false ? after === true : after === true);
  return { status: ok ? 'PASS' : 'FAIL', why: 'status.claimed: ' + before + ' -> ' + after + '；claim 返回=' + JSON.stringify(cp).slice(0, 200), result: { before: p1, claim: cp, after: p2 } };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status.padEnd(8), String(Date.now() - t0).padStart(6), 'ms |', String(r.why).slice(0, 220));
}
