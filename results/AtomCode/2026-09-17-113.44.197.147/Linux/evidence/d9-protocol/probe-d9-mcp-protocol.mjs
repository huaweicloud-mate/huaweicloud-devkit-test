// D9 MCP 协议域探针 — JSON-RPC 错误码 / dispatch 协议语义（v1.1.5 修复验证）
// v1.1.5 修复：dispatch 未知 method 携带 code=-32601；stdio 层按 error.code 映射，
// 未知方法返回 -32601（Method not found），内部错误返回 -32603（Internal error）。
import { dispatch } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { spawn } from 'node:child_process';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D9-2-1: dispatch 对未知 method 抛错并携带 code=-32601
{
  let err = null;
  try {
    await dispatch('nonexistent/method', {}, { sessionId: 'probe' });
  } catch (e) {
    err = e;
  }
  check('D9-2', '未知 method dispatch 抛 Method not found', err ? err.message : null, 'Method not found: nonexistent/method');
  check('D9-2', 'dispatch 异常携带 code=-32601', err ? err.code : null, -32601);
}

// D9-2-2: stdio 服务端对未知 method 实际返回 -32601（端到端，不再统一 -32603）
{
  const respCode = await new Promise((resolve) => {
    const serverPath = '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
    const child = spawn(process.execPath, [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
    });
    let buf = Buffer.alloc(0);
    let id = 1;
    const send = (o) => {
      const b = JSON.stringify(o);
      child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    };
    child.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      while (true) {
        const h = buf.indexOf('\r\n\r\n');
        if (h < 0) break;
        const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
        if (!m) { buf = buf.slice(h + 4); continue; }
        const n = +m[1];
        if (buf.length < h + 4 + n) break;
        const body = buf.slice(h + 4, h + 4 + n).toString();
        buf = buf.slice(h + 4 + n);
        try {
          const msg = JSON.parse(body);
          if (msg.id === 2) { resolve(msg.error?.code ?? null); child.kill(); }
        } catch {}
      }
    });
    send({ jsonrpc: '2.0', id: id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    setTimeout(() => send({ jsonrpc: '2.0', id: id++, method: 'hocuspocus/nonexistent', params: {} }), 300);
    setTimeout(() => { resolve('timeout'); child.kill(); }, 8000);
  });
  check('D9-2', 'stdio 服务端未知 method 返回 -32601（端到端）', respCode, -32601);
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