/**
 * D9-5 (P1): stdio 传输健壮性
 *
 * Tests:
 *  1. Send multiple requests rapidly → all should get responses
 *  2. Send a large request (big params) → should handle without crash
 *  3. Send request with extra whitespace/newlines → should still parse
 *
 * Expected: Robust stdio handling
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

  function writeRaw(data) {
    proc.stdin.write(data);
  }

  function close() {
    proc.stdin.end();
  }

  return { call, writeRaw, close, proc, pending };
}

async function main() {
  log('=== D9-5: stdio 传输健壮性 ===');
  log('');

  const client = createMcpClient();

  // Initialize
  await client.call('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe', version: '1.0.0' },
  });

  // --- Test 1: Send multiple requests rapidly → all should get responses ---
  log('Test 1: Send 10 requests rapidly → all should get responses');
  try {
    const NUM = 10;
    const promises = [];
    for (let i = 0; i < NUM; i++) {
      promises.push(client.call('tools/list', {}));
    }
    const responses = await Promise.all(promises);
    const allResponded = responses.every((r) => r.result && r.result.tools);
    const toolCounts = responses.map((r) => r.result?.tools?.length || 0);
    record(
      'All rapid requests get responses',
      allResponded,
      `${responses.length}/${NUM} responded, tool counts: ${toolCounts.join(',')}`
    );
  } catch (e) {
    record('All rapid requests get responses', false, `Exception: ${e.message}`);
  }
  log('');

  // --- Test 2: Send a large request (big params) → should handle without crash ---
  log('Test 2: Send large request (big params) → should handle without crash');
  try {
    // Create a large params object with a big string
    const largeString = 'A'.repeat(100000); // 100KB string
    const resp = await client.call('tools/call', {
      name: 'huaweicloud_plan_cli_command',
      arguments: {
        args: [largeString],
        allowWrites: false,
      },
    });

    if (resp.result) {
      record(
        'Large request handled without crash',
        true,
        `Server processed 100KB params, response content length: ${JSON.stringify(resp.result.content).length}`
      );
    } else if (resp.error) {
      // An error response is still OK — the server didn't crash
      record(
        'Large request handled without crash',
        true,
        `Server returned error (not crash): code ${resp.error.code}, message: ${resp.error.message?.substring(0, 100)}`
      );
    } else {
      record('Large request handled without crash', false, 'Unexpected response');
    }
  } catch (e) {
    record('Large request handled without crash', false, `Exception (possible crash): ${e.message}`);
  }
  log('');

  // --- Test 3: Send request with extra whitespace/newlines → should still parse ---
  log('Test 3: Send request with extra whitespace/newlines → should still parse');
  try {
    // Send a valid request with extra whitespace and newlines around it
    // The server reads line-by-line, so we need to send the JSON on one line
    // but with leading/trailing whitespace
    const id = 999;
    const promise = new Promise((resolve) => {
      client.pending.set(id, { resolve });
    });

    // Write with leading spaces and trailing spaces on the same line
    client.writeRaw('   {"jsonrpc":"2.0","id":999,"method":"tools/list","params":{}}   \n');

    const resp = await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    if (resp.result && resp.result.tools) {
      record(
        'Extra whitespace handled',
        true,
        `Server parsed request with leading/trailing whitespace, got ${resp.result.tools.length} tools`
      );
    } else if (resp.error) {
      record(
        'Extra whitespace handled',
        false,
        `Server returned error for whitespace-padded request: ${resp.error.message}`
      );
    } else {
      record('Extra whitespace handled', false, 'Unexpected response');
    }
  } catch (e) {
    if (e.message === 'timeout') {
      record('Extra whitespace handled', false, 'Server did not respond to whitespace-padded request (timeout)');
    } else {
      record('Extra whitespace handled', false, `Exception: ${e.message}`);
    }
  }
  log('');

  // --- Test 3b: Send with empty lines between requests ---
  log('Test 3b: Send with empty lines between requests');
  try {
    const id1 = 1001;
    const id2 = 1002;
    const p1 = new Promise((resolve) => { client.pending.set(id1, { resolve }); });
    const p2 = new Promise((resolve) => { client.pending.set(id2, { resolve }); });

    // Send request, then empty line, then another request
    client.writeRaw(`{"jsonrpc":"2.0","id":${id1},"method":"tools/list","params":{}}\n\n{"jsonrpc":"2.0","id":${id2},"method":"tools/list","params":{}}\n`);

    const [resp1, resp2] = await Promise.all([
      Promise.race([p1, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))]),
      Promise.race([p2, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))]),
    ]);

    const bothOk = resp1.result?.tools && resp2.result?.tools;
    record(
      'Empty lines between requests handled',
      !!bothOk,
      `Request 1: ${resp1.result?.tools?.length || 'error'} tools, Request 2: ${resp2.result?.tools?.length || 'error'} tools`
    );
  } catch (e) {
    record('Empty lines between requests handled', false, `Exception: ${e.message}`);
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

  process.exit(overallPass ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(2);
});
