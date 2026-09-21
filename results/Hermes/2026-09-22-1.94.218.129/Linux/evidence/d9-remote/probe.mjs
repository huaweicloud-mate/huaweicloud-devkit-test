// D9-10: MCP remote transport (HTTP) — startRemoteServer 默认端口 9528 监听 + initialize/tools.list 与 stdio 一致
import { writeFileSync } from 'node:fs';
import { startRemoteServer, DEFAULT_PORT, DEFAULT_HOST } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server-remote.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-22-1.94.218.129/Linux/evidence/d9-remote/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 180), expected: String(expected) });
}

test('D9-10', 'default-port-host', DEFAULT_PORT === 9528 && DEFAULT_HOST === '127.0.0.1', `${DEFAULT_HOST}:${DEFAULT_PORT}`, '默认 9528/127.0.0.1');

let serverHandle = null;
try {
  serverHandle = await startRemoteServer({ port: 0, host: '127.0.0.1' });  // port 0 = 随机端口，避免与已有 9528 冲突
  const port = serverHandle.port;
  test('D9-10', 'server-listen', port > 0, `port=${port}`, 'HTTP 服务监听');

  // initialize
  const initResp = await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-10-probe', version: '1' } } }),
  });
  const initJson = await initResp.json();
  test('D9-10', 'initialize-ok', !!initJson?.result?.protocolVersion, JSON.stringify(initJson).slice(0, 100), 'initialize 返回 protocolVersion');

  // tools/list
  const tlResp = await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  });
  const tlJson = await tlResp.json();
  const cnt = Array.isArray(tlJson?.result?.tools) ? tlJson.result.tools.length : 0;
  test('D9-10', 'tools-list-count', cnt > 0, `tools=${cnt}`, 'tools/list 返回非空数组（与 stdio 一致）');
} catch (e) {
  test('D9-10', 'server-start-error', false, String(e.message || e), 'remote 服务启动成功');
} finally {
  if (serverHandle) { try { await serverHandle.close(); } catch {} }
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);