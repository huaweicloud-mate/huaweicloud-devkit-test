// D9 MCP 协议域探针——dispatch / tools/list / JSON-RPC 错误码 / tools/call 格式
import { dispatch } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { TOOL_DEFINITIONS } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D9-5 stdio 传输健壮 / D9-4 协议生命周期: initialize 返回标准字段
{
  const init = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'probe', version: '1' } }, { sessionId: 'probe' });
  check('D9-5', 'initialize 返回 protocolVersion', init.protocolVersion, '2024-11-05');
  check('D9-5', 'initialize 返回 capabilities', typeof init.capabilities, 'object');
  check('D9-5', 'serverInfo.name', init.serverInfo.name, 'huaweicloud-devkit');
}

// D9-1 tools/list 合规
{
  const r = await dispatch('tools/list', {}, { sessionId: 'probe' });
  check('D9-1', 'tools/list 返回数组', Array.isArray(r.tools), true);
  check('D9-1', '工具数量 = tools.mjs 注册源数量', r.tools.length, TOOL_DEFINITIONS.length);
  const invalid = r.tools.filter((t) => !t.name || typeof t.inputSchema !== 'object');
  check('D9-1', '每个工具含 name + inputSchema', invalid.length, 0);
}

// D9-3 tools/call 响应格式
{
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'probe' });
  check('D9-3', 'tools/call 返回 content 数组', Array.isArray(r.content), true);
  check('D9-3', 'content[0].type=text', r.content?.[0]?.type, 'text');
  check('D9-3', 'isError=false', r.isError, false);
}

// D9-2 JSON-RPC 错误码: 未知方法 dispatch 抛 Unsupported method
{
  let err = null;
  try { await dispatch('nonexistent/method', {}, { sessionId: 'probe' }); } catch (e) { err = e; }
  check('D9-2', '未知方法抛 Unsupported method', err && err.message, 'Unsupported method: nonexistent/method');
  // 服务端 catch 统一 -32603，未区分 -32601（缺陷证据）
  const serverSrc = readFileSync('/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/mcp-server.mjs', 'utf8');
  check('D9-2', '服务端区分 -32601 (Method not found)', serverSrc.includes('-32601'), true);
  check('D9-2', '服务端含 -32603', serverSrc.includes('-32603'), true);
}

// D9-9 tools/call 超时语义: 检查是否有取消/超时协议字段（结构探测）
{
  const r = await dispatch('tools/list', {}, { sessionId: 'probe' });
  const hasTimeoutTool = r.tools.some((t) => /timeout/i.test((t.inputSchema?.properties?.timeoutMs?.description || '')));
  results.push(`SKIP  D9-9  结构探测 timeoutMs 描述存在 => ${JSON.stringify(hasTimeoutTool)}`);
  check('D9-9', '存在带 timeoutMs 参数的工具', hasTimeoutTool, true);
}

console.log('\n=== D9 MCP 协议域探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);