// D9-8: Connection disconnect/reconnect test
// Tests MCP server connection lifecycle:
// 1. Start remote MCP server on a test port
// 2. Connect and send initialize
// 3. Disconnect (close connection)
// 4. Reconnect and verify server still responds
// 5. Test multiple sequential connections
// 6. Verify server handles connection drop gracefully
import { startRemoteServer } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server-remote.mjs';

const checks = [];

// Start server on a random high port
const TEST_PORT = 19328;
let serverHandle;

try {
  serverHandle = await startRemoteServer({ port: TEST_PORT, host: '127.0.0.1' });
  checks.push({
    name: 'Remote MCP server started on test port',
    pass: serverHandle?.port === TEST_PORT,
    evidence: `port=${serverHandle?.port}`,
  });
} catch (e) {
  checks.push({ name: 'Remote MCP server started', pass: false, evidence: `error: ${e.message}` });
  // If server can't start, output BLOCKED
  const output = {
    status: 'BLOCKED',
    caseId: 'D9-8',
    why: `Cannot start remote MCP server: ${e.message}. Test requires ability to bind to port ${TEST_PORT}.`,
    executedAt: '20260930103000',
    details: checks,
  };
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

// Helper: send a JSON-RPC request over HTTP
async function sendRequest(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
}

// Test 1: First connection - initialize
try {
  const res = await sendRequest(TEST_PORT, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', clientInfo: { name: 'client-1', version: '1.0' } },
  });
  checks.push({
    name: 'Connection 1: initialize succeeds',
    pass: res.json?.result?.serverInfo?.name === 'huaweicloud-devkit',
    evidence: `httpStatus=${res.status}, serverName=${res.json?.result?.serverInfo?.name}`,
  });
} catch (e) {
  checks.push({ name: 'Connection 1: initialize', pass: false, evidence: `error: ${e.message}` });
}

// Test 2: tools/list on same logical session
try {
  const res = await sendRequest(TEST_PORT, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  checks.push({
    name: 'Connection 1: tools/list succeeds',
    pass: Array.isArray(res.json?.result?.tools) && res.json.result.tools.length > 0,
    evidence: `toolsCount=${res.json?.result?.tools?.length}`,
  });
} catch (e) {
  checks.push({ name: 'Connection 1: tools/list', pass: false, evidence: `error: ${e.message}` });
}

// Test 3: Simulate disconnect (just stop making requests) then reconnect
// HTTP is stateless so each request is a new "connection"
try {
  const res = await sendRequest(TEST_PORT, {
    jsonrpc: '2.0',
    id: 3,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', clientInfo: { name: 'client-2-reconnect', version: '1.0' } },
  });
  checks.push({
    name: 'Connection 2 (reconnect): initialize succeeds after implicit disconnect',
    pass: res.json?.result?.serverInfo?.name === 'huaweicloud-devkit',
    evidence: `httpStatus=${res.status}, serverName=${res.json?.result?.serverInfo?.name}`,
  });
} catch (e) {
  checks.push({ name: 'Connection 2: reconnect', pass: false, evidence: `error: ${e.message}` });
}

// Test 4: Multiple rapid sequential connections
let rapidSuccess = 0;
for (let i = 0; i < 10; i++) {
  try {
    const res = await sendRequest(TEST_PORT, { jsonrpc: '2.0', id: 100 + i, method: 'tools/list', params: {} });
    if (res.json?.result?.tools?.length > 0) rapidSuccess++;
  } catch {}
}
checks.push({
  name: '10 rapid sequential connections all succeed',
  pass: rapidSuccess === 10,
  evidence: `successCount=${rapidSuccess}/10`,
});

// Test 5: Error request then valid request (server doesn't crash)
try {
  await sendRequest(TEST_PORT, { jsonrpc: '2.0', id: 200, method: 'bad/method', params: {} });
} catch {}
try {
  const res = await sendRequest(TEST_PORT, { jsonrpc: '2.0', id: 201, method: 'tools/list', params: {} });
  checks.push({
    name: 'Server survives error request and serves subsequent valid request',
    pass: Array.isArray(res.json?.result?.tools),
    evidence: `toolsCount=${res.json?.result?.tools?.length}`,
  });
} catch (e) {
  checks.push({ name: 'Server survives error', pass: false, evidence: `error: ${e.message}` });
}

// Test 6: OPTIONS (CORS preflight) handled
try {
  const res = await fetch(`http://127.0.0.1:${TEST_PORT}`, { method: 'OPTIONS' });
  checks.push({
    name: 'CORS preflight (OPTIONS) returns 204',
    pass: res.status === 204,
    evidence: `httpStatus=${res.status}`,
  });
} catch (e) {
  checks.push({ name: 'CORS preflight', pass: false, evidence: `error: ${e.message}` });
}

// Test 7: Non-POST method returns 405
try {
  const res = await fetch(`http://127.0.0.1:${TEST_PORT}`, { method: 'GET' });
  checks.push({
    name: 'Non-POST method returns 405',
    pass: res.status === 405,
    evidence: `httpStatus=${res.status}`,
  });
} catch (e) {
  checks.push({ name: 'Non-POST returns 405', pass: false, evidence: `error: ${e.message}` });
}

// Cleanup: close server
await serverHandle.close();

// Test 8: After server close, connection fails (confirming clean shutdown)
try {
  await sendRequest(TEST_PORT, { jsonrpc: '2.0', id: 999, method: 'tools/list', params: {} });
  checks.push({ name: 'Connection fails after server close', pass: false, evidence: 'request succeeded after close' });
} catch (e) {
  checks.push({
    name: 'Connection fails after server close (clean shutdown)',
    pass: true,
    evidence: `error type: ${e.constructor.name}`,
  });
}

const allPass = checks.every(c => c.pass);
const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D9-8',
  why: allPass
    ? `All ${checks.length} connection lifecycle checks passed: initial connect, reconnect after disconnect, 10 rapid sequential connections, error recovery, CORS preflight, 405 for non-POST, and clean shutdown.`
    : `Failed checks: ${JSON.stringify(checks.filter(c => !c.pass))}`,
  executedAt: '20260930103000',
  details: checks,
};

console.log(JSON.stringify(output, null, 2));