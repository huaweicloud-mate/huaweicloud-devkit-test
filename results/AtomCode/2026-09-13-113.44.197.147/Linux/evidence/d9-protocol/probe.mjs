// MCP 协议探针：直调 mcp-protocol.mjs dispatch
import { dispatch } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { TOOL_DEFINITIONS } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
function eq(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { eq(id, desc, Boolean(cond), true); }

// D9-1 tools/list 合规
{
  const r = await dispatch('tools/list', {});
  bool('D9-1', 'tools/list 返回数组', Array.isArray(r.tools));
  eq('D9-1', '工具全集 = 39 (TOOL_DEFINITIONS)', r.tools.length, TOOL_DEFINITIONS.length);
  bool('D9-1', '每个工具有 name+description 字段', r.tools.every((t) => t.name && ('description' in t) && t.inputSchema));
}
// D9-4 协议生命周期 initialize
{
  const r = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'AtomCode', version: '0.0.0' } });
  eq('D9-4', 'serverInfo.name', r.serverInfo.name, 'huaweicloud-devkit');
  eq('D9-4', 'protocolVersion', r.protocolVersion, '2024-11-05');
  bool('D9-4', 'capabilities.tools 存在', r.capabilities && 'tools' in r.capabilities);
}
// D9-3 tools/call 响应格式
{
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ecs' } }, { sessionId: 'probe' });
  bool('D9-3', 'tools/call 返回 content 数组', Array.isArray(r.content));
  eq('D9-3', 'content[0].type', r.content[0]?.type, 'text');
  eq('D9-3', 'isError=false', r.isError, false);
}
// D9-2 JSON-RPC 错误码：未知 method 抛错
{
  let msg = null;
  try { await dispatch('unknown/method', {}); } catch (e) { msg = e.message; }
  bool('D9-2', '未知 method 抛 Unsupported method', /Unsupported method/.test(msg || ''));
}
// D9-7 协议版本协商降级：resources/list
{
  const r = await dispatch('resources/list', {});
  eq('D9-7', 'resources/list 返回空数组', JSON.stringify(r.resources), '[]');
}

console.log(`TOTAL pass=${pass} fail=${fail}`);