// Real probe for D6-1: 检索响应延迟
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const msgs = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }];
  for (let i = 0; i < 5; i++) msgs.push({ jsonrpc: '2.0', id: i + 2, method: 'tools/call', params: { name: 'huaweicloud_search_docs', arguments: { query: 'ECS 创建 实例 ' + i } } });
  const s = await timedSession(msgs, 60000);
  const lat = []; for (let i = 2; i <= 6; i++) if (s.arrivals[i] && s.sentAt[i]) lat.push(s.arrivals[i] - s.sentAt[i]);
  lat.sort((a, b) => a - b);
  const p95 = lat.length ? lat[Math.max(0, Math.ceil(lat.length * 0.95) - 1)] : null;
  const ok = lat.length >= 4 && p95 !== null && p95 < 2000;
  return { status: ok ? 'PASS' : 'FAIL', why: '样本=' + lat.length + ' p95=' + p95 + 'ms 阈值2000ms', result: { latencies: lat, p95 } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
