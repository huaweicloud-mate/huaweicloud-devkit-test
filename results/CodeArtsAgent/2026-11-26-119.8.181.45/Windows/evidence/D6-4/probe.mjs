// Real probe for D6-4: 并发调度正确性
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, init } from '../../_runner/lib.mjs';
const run = async () => {
  const msgs = [init];
  for (let i = 0; i < 30; i++) msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { vendorConfirmed: 'I confirm I am using Huawei Cloud', intent: '查询 ECS 实例 ' + i } } });
  const t0 = Date.now();
  const s = await mcpSession(msgs, 120000);
  const ids = s.responses.filter((r) => r.id >= 2).map((r) => r.id);
  const uniq = new Set(ids);
  const ok = ids.length === 30 && uniq.size === 30 && s.responses.every((r) => r.jsonrpc === '2.0');
  return { status: ok ? 'PASS' : 'FAIL', why: '并发30请求 响应=' + ids.length + ' 唯一=' + uniq.size + ' 耗时=' + (Date.now() - t0) + 'ms', result: { count: ids.length, unique: uniq.size } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
