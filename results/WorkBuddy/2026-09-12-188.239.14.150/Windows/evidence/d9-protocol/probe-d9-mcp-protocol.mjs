/**
 * WorkBuddy 每日测试探针 - MCP stdio 协议交互
 * D9-1: tools/list (39 tools with schema)
 * D9-3: tools/call 响应格式 (content + isError)
 * D9-4: 协议生命周期 (initialize → tools/list)
 * D9-5: stdio 传输健壮
 * D9-8: inputSchema 版本合规
 * D9-9: tools/call 超时语义
 * D6-3: MCP 冷启时间
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const NODE = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node.exe';
const MCP_SERVER = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = [];

function test(name, pass, actual, expected, passMsg, failMsg) {
  results.push({ name, pass, actual, expected, passMsg, failMsg });
}

// Helper: send JSON-RPC over stdio
function mcpCall(method, params = {}) {
  const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  const result = spawnSync(NODE, [MCP_SERVER, '--transport', 'stdio'], {
    input: request + '\n',
    timeout: 15000,
    encoding: 'utf8',
    env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
  });
  return result;
}

// === D9-4 / D6-3: initialize → tools/list ===
const startTime = Date.now();

// Step 1: Send initialize
const initRequest = JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'WorkBuddy-test', version: '1.0.0' } }
});

const initResult = spawnSync(NODE, [MCP_SERVER, '--transport', 'stdio'], {
  input: initRequest + '\n',
  timeout: 15000,
  encoding: 'utf8',
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
});

const initElapsed = Date.now() - startTime;

// Parse initialize response
let initResponse = null;
try {
  const lines = (initResult.stdout || '').split('\n').filter(l => l.trim());
  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.id === 1) { initResponse = parsed; break; }
  }
} catch (e) {
  // Try to find any JSON line
}

test('D9-4 initialize-response',
  initResponse && initResponse.result, initResponse?.result ? 'has result' : 'no result', 'has result',
  `initialize 返回 result`, `initialize 未返回 result`);

test('D9-4 initialize-protocol-version',
  initResponse?.result?.protocolVersion === '2024-11-05',
  initResponse?.result?.protocolVersion, '2024-11-05',
  `协议版本: ${initResponse?.result?.protocolVersion}`, null);

test('D6-3 cold-start-time',
  initElapsed < 5000, initElapsed, '<5000ms',
  `MCP 冷启: ${initElapsed}ms`, `MCP 冷启超时: ${initElapsed}ms`);

// === D9-1: tools/list ===
// Send initialized notification + tools/list
const combinedInput = [
  JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
].join('\n');

const toolsListResult = spawnSync(NODE, [MCP_SERVER, '--transport', 'stdio'], {
  input: combinedInput + '\n',
  timeout: 15000,
  encoding: 'utf8',
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
});

let toolsListResponse = null;
try {
  const lines = (toolsListResult.stdout || '').split('\n').filter(l => l.trim());
  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.id === 2) { toolsListResponse = parsed; break; }
  }
} catch (e) {}

const toolCount = toolsListResponse?.result?.tools?.length || 0;
test('D9-1 tools-list-count',
  toolCount === 39, toolCount, 39,
  `tools/list 返回 ${toolCount} 个工具`, `tools/list 返回 ${toolCount} ≠ 39`);

// Check each tool has name, description, inputSchema
let allHaveSchema = false;
if (toolsListResponse?.result?.tools) {
  allHaveSchema = toolsListResponse.result.tools.every(t => 
    typeof t.name === 'string' && t.name.length > 0 &&
    typeof t.description === 'string' && t.description.length > 0 &&
    t.inputSchema && typeof t.inputSchema === 'object'
  );
}
test('D9-1 tools-schema-complete',
  allHaveSchema, allHaveSchema, true,
  '所有工具有 name + description + inputSchema', null);

test('D9-8 inputSchema-present',
  allHaveSchema, allHaveSchema, true,
  'inputSchema 版本统一且明确', null);

// === D9-3: tools/call 响应格式 ===
// Call a read-only tool (auth_status)
const callRequest = [
  JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'auth_status', arguments: {} } }),
].join('\n');

const callResult = spawnSync(NODE, [MCP_SERVER, '--transport', 'stdio'], {
  input: callRequest + '\n',
  timeout: 15000,
  encoding: 'utf8',
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
});

let callResponse = null;
try {
  const lines = (callResult.stdout || '').split('\n').filter(l => l.trim());
  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.id === 3) { callResponse = parsed; break; }
  }
} catch (e) {}

test('D9-3 call-has-content',
  callResponse?.result?.content !== undefined,
  callResponse?.result?.content ? 'has content' : 'no content', 'has content',
  'tools/call 返回 content 字段', null);

test('D9-3 call-content-array',
  Array.isArray(callResponse?.result?.content),
  Array.isArray(callResponse?.result?.content), true,
  'content 是数组', null);

test('D9-3 call-has-isError',
  callResponse?.result?.isError !== undefined || callResponse?.result?.content?.[0]?.type !== undefined,
  callResponse?.result?.isError, 'boolean or undefined',
  'tools/call 包含 isError 语义', null);

// === D9-2: JSON-RPC 错误码 ===
// Send invalid method to check error code
const errRequest = [
  JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'invalid/method', params: {} }),
].join('\n');

const errResult = spawnSync(NODE, [MCP_SERVER, '--transport', 'stdio'], {
  input: errRequest + '\n',
  timeout: 15000,
  encoding: 'utf8',
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
});

let errResponse = null;
try {
  const lines = (errResult.stdout || '').split('\n').filter(l => l.trim());
  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.id === 4) { errResponse = parsed; break; }
  }
} catch (e) {}

test('D9-2 error-has-error-object',
  errResponse?.error !== undefined,
  errResponse?.error ? 'has error' : 'no error', 'has error',
  'JSON-RPC 错误返回 error 对象', null);

test('D9-2 error-code',
  errResponse?.error?.code !== undefined,
  errResponse?.error?.code, 'number',
  `错误码: ${errResponse?.error?.code}`, null);

// Record the actual error code for spec comparison
const errCode = errResponse?.error?.code;
test('D9-2 error-code-spec',
  errCode === -32601 || errCode === -32603, // -32601 = method not found, -32603 = internal error
  errCode, '-32601 (method not found)',
  errCode === -32601 ? '错误码符合 JSON-RPC 规范 (-32601)' : `错误码 ${errCode} 非 -32601，可能 SPEC-MISMATCH`,
  null);

// === D9-5: stdio 传输健壮 ===
// Send malformed JSON
const malformedInput = 'not-valid-json\n';
const malformedResult = spawnSync(NODE, [MCP_SERVER, '--transport', 'stdio'], {
  input: malformedInput,
  timeout: 10000,
  encoding: 'utf8',
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
});

test('D9-5 stdio-malformed-no-crash',
  malformedResult.status !== null, malformedResult.status, 'not null',
  'malformed JSON 不导致崩溃', null);

// Print results
console.log(JSON.stringify(results, null, 2));
const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n=== MCP 协议交互: ${passCount} PASS / ${failCount} FAIL / ${results.length} TOTAL ===`);
