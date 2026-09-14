/**
 * D9-6 (P1): 并发请求处理
 *
 * Tests:
 *  1. Send 3 requests simultaneously (different IDs) → all should get responses with correct IDs
 *  2. Send more concurrent requests (10) → all should get correct responses
 *
 * Expected: Concurrent request handling
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
  const receivedIds = [];

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
          receivedIds.push(msg.id);
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

  function close() {
    proc.stdin.end();
  }

  return { call, close, proc, get receivedIds() { return receivedIds; }, get nextId() { return nextId; } };
}

async function main() {
  log('=== D9-6: 并发请求处理 ===');
  log('');

  const client = createMcpClient();

  // Initialize
  await client.call('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe', version: '1.0.0' },
  });

  // --- Test 1: Send 3 requests simultaneously (different IDs) ---
  log('Test 1: Send 3 requests simultaneously → all should get responses with correct IDs');
  try {
    // Record the starting ID
    const startId = client.nextId;

    // Fire 3 requests simultaneously without awaiting
    const p1 = client.call('tools/list', {});
    const p2 = client.call('tools/list', {});
    const p3 = client.call('tools/list', {});

    // Now await all
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    // Check all got results
    const allHaveResults = r1.result && r2.result && r3.result;
    const allHaveTools = allHaveResults &&
      r1.result.tools && r2.result.tools && r3.result.tools;

    // Check IDs are correct (they should be startId, startId+1, startId+2)
    // The responses should have matching IDs
    const expectedIds = [startId, startId + 1, startId + 2];
    const actualIds = [r1.id, r2.id, r3.id];
    const idsCorrect = actualIds.every((id, i) => id === expectedIds[i]);

    record(
      '3 concurrent requests all responded',
      !!allHaveTools,
      `Results: r1=${!!r1.result?.tools}, r2=${!!r2.result?.tools}, r3=${!!r3.result?.tools}`
    );
    record(
      'Response IDs are correct',
      idsCorrect,
      `Expected IDs: ${expectedIds.join(',')}, Actual IDs: ${actualIds.join(',')}`
    );
  } catch (e) {
    record('3 concurrent requests all responded', false, `Exception: ${e.message}`);
    record('Response IDs are correct', false, `Exception: ${e.message}`);
  }
  log('');

  // --- Test 2: Send 10 concurrent requests with different methods ---
  log('Test 2: Send 10 concurrent requests (mix of tools/list and tools/call)');
  try {
    const startId2 = client.nextId;
    const promises = [];
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        promises.push(client.call('tools/list', {}));
      } else {
        promises.push(client.call('tools/call', { name: 'huaweicloud_check_cli', arguments: {} }));
      }
    }

    const responses = await Promise.all(promises);
    const allResponded = responses.every((r) => r.result !== undefined);
    const expectedIds2 = Array.from({ length: 10 }, (_, i) => startId2 + i);
    const actualIds2 = responses.map((r) => r.id);
    const idsCorrect2 = actualIds2.every((id, i) => id === expectedIds2[i]);

    record(
      '10 concurrent requests all responded',
      allResponded,
      `${responses.filter((r) => r.result).length}/10 responded`
    );
    record(
      '10 concurrent request IDs correct',
      idsCorrect2,
      `Expected: ${expectedIds2.join(',')}, Actual: ${actualIds2.join(',')}`
    );
  } catch (e) {
    record('10 concurrent requests all responded', false, `Exception: ${e.message}`);
    record('10 concurrent request IDs correct', false, `Exception: ${e.message}`);
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
