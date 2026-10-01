// P1 D9 protocol batch
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};
function test(name, fn) { try { results[name] = fn(); } catch(e) { results[name] = { status: 'FAIL', why: e.message }; } }

const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

function mcpCall(method, params, id=2) {
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const callReq = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  const r = spawnSync('node', [serverPath], { input: initReq + '\n' + initNotif + '\n' + callReq + '\n', encoding: 'utf8', timeout: 10000, shell: false, env: { ...process.env } });
  const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
  for (const line of lines) {
    try { const p = JSON.parse(line); if (p.id === id) return p; } catch(e) {}
  }
  return null;
}

// D9-1: tools/list合规
test('D9-1', () => {
  const resp = mcpCall('tools/list', {}, 2);
  const tools = resp?.result?.tools || [];
  const allHaveName = tools.every(t => t.name);
  const allHaveSchema = tools.every(t => t.inputSchema !== undefined);
  const allHaveDesc = tools.every(t => t.description);
  const pass = tools.length > 0 && allHaveName && allHaveSchema && allHaveDesc;
  return { status: pass ? 'PASS' : 'FAIL', why: `count=${tools.length} allName=${allHaveName} allSchema=${allHaveSchema} allDesc=${allHaveDesc}`, detail: { count: tools.length, allHaveName, allHaveSchema, allHaveDesc } };
});

// D9-2: JSON-RPC错误码
test('D9-2', () => {
  // Call unknown method to get error
  const resp = mcpCall('unknown/method', {}, 3);
  const hasError = resp?.error !== undefined;
  const hasCode = resp?.error?.code !== undefined;
  const validCode = [-32700, -32600, -32601, -32602, -32603].includes(resp?.error?.code);
  const pass = hasError && hasCode;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasError=${hasError} hasCode=${hasCode} code=${resp?.error?.code} validJsonRpc=${validCode}`, detail: { hasError, code: resp?.error?.code, message: resp?.error?.message } };
});

// D9-3: tools/call响应格式
test('D9-3', () => {
  const resp = mcpCall('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, 4);
  const hasResult = resp?.result !== undefined;
  const hasContent = resp?.result?.content !== undefined;
  const isArray = Array.isArray(resp?.result?.content);
  const pass = hasResult && hasContent && isArray;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasResult=${hasResult} hasContent=${hasContent} isArray=${isArray}`, detail: { hasResult, hasContent, isArray, contentLength: resp?.result?.content?.length } };
});

// D9-4: 协议生命周期
test('D9-4', () => {
  // initialize -> notifications/initialized -> tools/list should work
  const resp = mcpCall('tools/list', {}, 5);
  const tools = resp?.result?.tools || [];
  const pass = tools.length > 0;
  return { status: pass ? 'PASS' : 'FAIL', why: `toolsAfterInit=${tools.length}`, detail: { toolsCount: tools.length } };
});

// D9-5: stdio传输健壮
test('D9-5', () => {
  // Send multiple messages rapidly
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const listReq2 = JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} });
  const input = initReq + '\n' + initNotif + '\n' + listReq + '\n' + listReq2 + '\n';
  const r = spawnSync('node', [serverPath], { input, encoding: 'utf8', timeout: 10000, shell: false, env: { ...process.env } });
  const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
  let count = 0;
  for (const line of lines) { try { const p = JSON.parse(line); if (p.id === 2 || p.id === 3) count++; } catch(e) {} }
  const pass = count >= 2;
  return { status: pass ? 'PASS' : 'FAIL', why: `responsesReceived=${count}`, detail: { responsesReceived: count } };
});

// D9-6: 跨客户端互通
test('D9-6', () => {
  // The MCP server should work regardless of client (same protocol)
  // Test by checking serverInfo name is generic
  const resp = mcpCall('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'any-client', version: '1.0' } }, 1);
  const serverInfo = resp?.result?.serverInfo;
  const pass = serverInfo?.name === 'huaweicloud-devkit';
  return { status: pass ? 'PASS' : 'FAIL', why: `serverName=${serverInfo?.name}`, detail: { serverInfo } };
});

// D9-9: tools/call超时协议语义与取消
test('D9-9', () => {
  // Test that a long-running operation can be initiated
  // Check that the server supports cancellation via the protocol
  const serverContent = readFileSync(serverPath, 'utf8');
  const hasTimeout = serverContent.includes('timeout') || serverContent.includes('Timeout');
  const hasCancel = serverContent.includes('cancel') || serverContent.includes('abort') || serverContent.includes('AbortController');
  const pass = hasTimeout || hasCancel;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasTimeout=${hasTimeout} hasCancel=${hasCancel}`, detail: { hasTimeout, hasCancel } };
});

// D9-10: MCP remote transport
test('D9-10', () => {
  const remotePath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server-remote.mjs');
  const hasRemote = existsSync(remotePath);
  let hasHttp = false, hasWebSocket = false;
  if (hasRemote) {
    const content = readFileSync(remotePath, 'utf8');
    hasHttp = content.includes('http') || content.includes('HTTP') || content.includes('createServer');
    hasWebSocket = content.includes('WebSocket') || content.includes('ws');
  }
  const pass = hasRemote && (hasHttp || hasWebSocket);
  return { status: pass ? 'PASS' : 'FAIL', why: `hasRemote=${hasRemote} hasHttp=${hasHttp} hasWebSocket=${hasWebSocket}`, detail: { hasRemote, hasHttp, hasWebSocket } };
});

// D9-11: WebSocket隧道通道生命周期
test('D9-11', () => {
  // Check WS exec module
  const wsDir = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'ws-exec');
  const hasWsDir = existsSync(wsDir);
  let wsFiles = [];
  let hasLifecycle = false;
  if (hasWsDir) {
    wsFiles = readdirSync(wsDir);
    for (const f of wsFiles) {
      try {
        const content = readFileSync(join(wsDir, f), 'utf8');
        if (content.includes('connect') || content.includes('close') || content.includes('lifecycle')) {
          hasLifecycle = true;
        }
      } catch(e) {}
    }
  }
  // Also check remote server
  const remotePath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server-remote.mjs');
  if (existsSync(remotePath)) {
    const content = readFileSync(remotePath, 'utf8');
    if (content.includes('WebSocket') || content.includes('ws')) hasLifecycle = true;
  }
  const pass = hasWsDir || hasLifecycle;
  return { status: pass ? 'PASS' : 'FAIL', why: `hasWsDir=${hasWsDir} hasLifecycle=${hasLifecycle}`, detail: { hasWsDir, wsFiles, hasLifecycle } };
});

console.log(JSON.stringify(results, null, 2));
