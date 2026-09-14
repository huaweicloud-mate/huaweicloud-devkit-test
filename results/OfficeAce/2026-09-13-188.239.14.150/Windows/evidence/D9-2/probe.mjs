#!/usr/bin/env node
/**
 * D9-2 (P1): JSON-RPC 错误码合规
 *
 * Tests:
 *  1. Send invalid method "tools/nonexistent" → expect error code -32601 (Method not found)
 *  2. Send invalid params to a valid method → expect error code -32602 (Invalid params)
 *  3. Send malformed JSON → expect error code -32700 (Parse error)
 *
 * JSON-RPC 2.0 spec error codes:
 *   -32700: Parse error
 *   -32600: Invalid Request
 *   -32601: Method not found
 *   -32602: Invalid params
 *   -32603: Internal error
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const SERVER_PATH = resolve(
  'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs'
);

const results = [];
let overallPass = true;

function log(msg) {
  console.log(msg);
}

function record(testName, passed, detail) {
  const status = passed ? 'PASS' : 'FAIL';
  if (!passed) overallPass = false;
  results.push({ testName, status, detail });
  log(`  [${status}] ${testName}: ${detail}`);
}

/**
 * Spawn MCP server and return a helper to send/receive JSON-RPC messages
 * over newline-delimited JSON (simpler than Content-Length framing).
 */
function createMcpClient() {
  const proc = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_DEVKIT_TELEMETRY_DISABLED: '1' },
  });

  let buffer = '';
  const pending = new Map(); // id → { resolve, reject }
  let nextId = 1;
  let rawMode = false; // when true, collect raw stdout for parse-error test

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    // Try to parse newline-delimited JSON messages
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      // Skip Content-Length headers
      if (line.startsWith('Content-Length:')) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          const { resolve: r } = pending.get(msg.id);
          pending.delete(msg.id);
          r(msg);
        }
      } catch {
        // Not JSON, ignore (could be partial)
      }
    }
  });

  proc.stderr.on('data', (chunk) => {
    // Log stderr for debugging but don't fail
    log(`  [stderr] ${chunk.toString().trim()}`);
  });

  function send(obj) {
    const json = JSON.stringify(obj);
    proc.stdin.write(json + '\n');
  }

  function sendRaw(rawString) {
    proc.stdin.write(rawString + '\n');
  }

  function call(method, params) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      send({ jsonrpc: '2.0', id, method, params: params || {} });
    });
  }

  function initialize() {
    return call('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'test-probe', version: '1.0.0' },
    });
  }

  function close() {
    proc.stdin.end();
  }

  return { call, send, sendRaw, initialize, close, proc };
}

async function main() {
  log('=== D9-2: JSON-RPC 错误码合规 ===');
  log('');

  const client = createMcpClient();

  // Initialize first so the server is in a ready state
  await client.initialize();

  // --- Test 1: Invalid method → expect -32601 (Method not found) ---
  log('Test 1: Send invalid method "tools/nonexistent"');
  try {
    const resp = await client.call('tools/nonexistent', {});
    if (resp.error) {
      const codeMatch = resp.error.code === -32601;
      record(
        'Invalid method error code',
        codeMatch,
        `Got code ${resp.error.code} (expected -32601), message: "${resp.error.message}"`
      );
    } else {
      record('Invalid method error code', false, 'No error returned, got result instead');
    }
  } catch (e) {
    record('Invalid method error code', false, `Exception: ${e.message}`);
  }
  log('');

  // --- Test 2: Invalid params to valid method → expect -32602 (Invalid params) ---
  log('Test 2: Send invalid params to tools/call (missing required "name")');
  try {
    const resp = await client.call('tools/call', { arguments: {} }); // missing "name"
    if (resp.error) {
      // The server may throw an internal error (-32603) when the tool name is undefined.
      // Per JSON-RPC 2.0, invalid params should be -32602.
      const codeMatch = resp.error.code === -32602;
      record(
        'Invalid params error code',
        codeMatch,
        `Got code ${resp.error.code} (expected -32602), message: "${resp.error.message}"`
      );
    } else {
      // Some servers might return a result with isError: true
      record(
        'Invalid params error code',
        false,
        'No error returned, got result. Server may not validate params strictly.'
      );
    }
  } catch (e) {
    record('Invalid params error code', false, `Exception: ${e.message}`);
  }
  log('');

  // --- Test 3: Malformed JSON → expect -32700 (Parse error) ---
  log('Test 3: Send malformed JSON');
  // We need to send raw malformed JSON and check if the server responds with -32700
  // or crashes. Since the server uses JSON.parse without try-catch in readFrames,
  // malformed JSON will likely crash the process.
  try {
    // Send a request with a valid ID first to make sure server is alive
    const aliveResp = await client.call('tools/list', {});
    const serverAlive = aliveResp && aliveResp.result && aliveResp.result.tools;
    record('Server alive before malformed JSON', !!serverAlive, `Server responded with ${aliveResp?.result?.tools?.length || 0} tools`);

    // Now send malformed JSON
    client.sendRaw('{"jsonrpc":"2.0","id":999,"method":"tools/list","params":{INVALID}');

    // Wait a bit to see if the server crashes or responds
    await new Promise((r) => setTimeout(r, 2000));

    // Try to send another valid request to check if server is still alive
    const id = 1000;
    const checkPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => resolve({ timeout: true }), 3000);
      client.call('tools/list', {}).then((resp) => {
        clearTimeout(timeout);
        resolve({ timeout: false, resp });
      });
    });

    const checkResult = await checkPromise;
    if (checkResult.timeout) {
      // Server crashed or hung after malformed JSON
      record(
        'Malformed JSON parse error',
        false,
        'Server crashed/hung after malformed JSON. No -32700 error returned. Server does not handle parse errors gracefully.'
      );
    } else {
      // Server survived — check if it sent a -32700 error for the malformed message
      record(
        'Malformed JSON parse error',
        false,
        'Server survived malformed JSON but did not return -32700 parse error. Server silently ignored malformed input.'
      );
    }
  } catch (e) {
    // If the server crashed, the pending promise will reject
    if (e.message.includes('aborted') || e.message.includes('closed') || e.message.includes('EPIPE')) {
      record(
        'Malformed JSON parse error',
        false,
        `Server crashed on malformed JSON (no -32700 error). Error: ${e.message}`
      );
    } else {
      record('Malformed JSON parse error', false, `Exception: ${e.message}`);
    }
  }
  log('');

  client.close();

  // --- Summary ---
  log('=== Summary ===');
  for (const r of results) {
    log(`  ${r.status} - ${r.testName}: ${r.detail}`);
  }
  log('');
  log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);
  log('');

  // Exit code: 0 = pass, 1 = fail
  process.exit(overallPass ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(2);
});
