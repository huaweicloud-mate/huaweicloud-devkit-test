// D9 MCP 协议域探针 — JSON-RPC 错误码 / dispatch 协议语义
import { dispatch } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D9-2 JSON-RPC 未知方法错误码语义：dispatch 抛 Unsupported method，服务端应映射 -32601
{
  let err = null;
  try {
    await dispatch('nonexistent/method', {}, { sessionId: 'probe' });
  } catch (e) {
    err = e;
  }
  check('D9-2', '未知方法 dispatch 抛异常', err ? err.message : null, 'Unsupported method: nonexistent/method');

  const serverSrc = readFileSync('/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs', 'utf8');
  const catchBlock = serverSrc.slice(serverSrc.indexOf('} catch (error)'), serverSrc.indexOf('} catch (error)') + 220);
  const has32601 = catchBlock.includes('-32601') || serverSrc.includes('-32601');
  const uses32603 = serverSrc.includes('-32603');
  // 预期：未知方法应映射 -32601（Method not found），而非统一 -32603（Internal error）
  check('D9-2', '服务端区分 -32601/-32603', has32601, true);
  check('D9-2', '服务端含 -32603 (internal)', uses32603, true);
}

// D9-1 tools/list 返回数组
{
  const r = await dispatch('tools/list', {}, { sessionId: 'probe' });
  check('D9-1', 'tools/list 返回数组', Array.isArray(r.tools), true);
}

console.log('\n=== D9 MCP 协议域探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);