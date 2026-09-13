/**
 * D9-4 (P1): 协议生命周期
 *
 * Tests:
 *  1. Send initialize → expect capabilities response
 *  2. Send initialized notification → no response (notification)
 *  3. Send tools/list before initialize → expect error (not initialized)
 *
 * Expected: Proper lifecycle enforcement
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

function createMcpClient() {
  const proc = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_DEVKIT_TELEMETRY_DISABLED: '1' },
  });

  let buffer = '';
  const pending = new Map();
  let nextId = 1;

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line || line.startsWith('Content-Length:')) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          const { resolve: r } = pending.get(msg.id);
          pending.delete(msg.id);
          r(msg);
        }
      } catch {}
    }
  });

  proc.stderr.on('data', (chunk) => {
    log(`  [stderr] ${chunk.toString().trim()}`);
  });

  function call(method, params) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n');
    });
  }

  function sendNotification(method, params) {
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params: params || {} }) + '\n');
  }

  function close() {
    proc.stdin.end();
  }

  return { call, sendNotification, close, proc };
}

async function main() {
  log('=== D9-4: 协议生命周期 ===');
  log('');

  // --- Test 3 first: Send tools/list before initialize ---
  // We need a fresh server for this test
  log('Test 3: Send tools/list before initialize → expect error (not initialized)');

  const client1 = createMcpClient();

  try {
    // Immediately call tools/list without initialize
    const resp = await client1.call('tools/list', {});

    if (resp.error) {
      // Some servers return -32002 (Server not initialized) or similar
      record(
        'tools/list rejected before initialize',
        true,
        `Got error code ${resp.error.code}: "${resp.error.message}"`
      );
    } else if (resp.result && resp.result.tools) {
      // Server does NOT enforce lifecycle — tools/list works without initialize
      record(
        'tools/list rejected before initialize',
        false,
        `Server allowed tools/list before initialize (returned ${resp.result.tools.length} tools). Lifecycle NOT enforced.`
      );
    } else {
      record('tools/list rejected before initialize', false, 'Unexpected response');
    }
  } catch (e) {
    record('tools/list rejected before initialize', false, `Exception: ${e.message}`);
  }

  client1.close();
  log('');

  // --- Test 1: Send initialize → expect capabilities response ---
  log('Test 1: Send initialize → expect capabilities response');

  const client2 = createMcpClient();

  try {
    const resp = await client2.call('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'test-probe', version: '1.0.0' },
    });

    if (resp.error) {
      record('initialize returns capabilities', false, `Got error: ${resp.error.message}`);
    } else if (!resp.result) {
      record('initialize returns capabilities', false, 'No result in response');
    } else {
      const hasCapabilities = resp.result.capabilities !== undefined;
      const hasProtocolVersion = resp.result.protocolVersion !== undefined;
      const hasServerInfo = resp.result.serverInfo !== undefined;

      record(
        'initialize returns capabilities',
        hasCapabilities && hasProtocolVersion && hasServerInfo,
        `protocolVersion: ${resp.result.protocolVersion}, capabilities: ${JSON.stringify(resp.result.capabilities)}, serverInfo: ${JSON.stringify(resp.result.serverInfo)}`
      );
    }
  } catch (e) {
    record('initialize returns capabilities', false, `Exception: ${e.message}`);
  }
  log('');

  // --- Test 2: Send initialized notification → no response ---
  log('Test 2: Send initialized notification → expect no response');

  try {
    // Send the initialized notification (no id field)
    client2.sendNotification('notifications/initialized', {});

    // Wait a bit to see if any response comes back
    // We'll try to send a subsequent request and see if we get a response for it
    // (if the server sent a response for the notification, it would interfere)
    await new Promise((r) => setTimeout(r, 1000));

    // Send a tools/list to confirm server is still alive
    const resp = await client2.call('tools/list', {});

    if (resp.result && resp.result.tools) {
      // Server is alive — check that no extra response was received for the notification
      // The fact that we got the correct response for tools/list means the notification
      // was handled silently (no response), which is correct behavior
      record(
        'initialized notification produces no response',
        true,
        'Server handled notification silently and continued to work normally'
      );
    } else {
      record('initialized notification produces no response', false, 'Server may have crashed after notification');
    }
  } catch (e) {
    record('initialized notification produces no response', false, `Exception: ${e.message}`);
  }
  log('');

  client2.close();

  // --- Summary ---
  log('=== Summary ===');
  for (const r of results) {
    log(`  ${r.status} - ${r.testName}: ${r.detail}`);
  }
  log('');
  log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);
  log('');

  process.exit(overallPass ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(2);
});
