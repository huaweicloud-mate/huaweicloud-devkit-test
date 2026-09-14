/**
 * D9-3 (P1): tools/call 响应格式合规
 *
 * Tests:
 *  1. Call a valid tool (huaweicloud_check_cli) → expect response with result.content array
 *  2. Each content item should have type: "text" and text: string
 *  3. Response should have isError: false (or no isError field)
 *
 * Expected: MCP-compliant response format
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

  function close() {
    proc.stdin.end();
  }

  return { call, close, proc };
}

async function main() {
  log('=== D9-3: tools/call 响应格式合规 ===');
  log('');

  const client = createMcpClient();

  // Initialize
  await client.call('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe', version: '1.0.0' },
  });

  // --- Test 1: Call valid tool → expect result.content array ---
  log('Test 1: Call huaweicloud_check_cli → expect result.content array');
  try {
    const resp = await client.call('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });

    if (resp.error) {
      record('Tool call returns result', false, `Got error: ${resp.error.message}`);
    } else if (!resp.result) {
      record('Tool call returns result', false, 'No result field in response');
    } else {
      record('Tool call returns result', true, 'Response has result field');
    }

    // --- Test 2: result.content is array with type: "text" and text: string ---
    log('Test 2: Check content array structure');
    if (resp.result && resp.result.content) {
      const content = resp.result.content;
      const isArray = Array.isArray(content);
      record('content is array', isArray, `typeof content: ${typeof content}, isArray: ${isArray}`);

      if (isArray && content.length > 0) {
        let allValid = true;
        let details = [];
        for (let i = 0; i < content.length; i++) {
          const item = content[i];
          const hasType = item.type === 'text';
          const hasText = typeof item.text === 'string';
          if (!hasType || !hasText) allValid = false;
          details.push(`item[${i}]: type=${JSON.stringify(item.type)}, text=${typeof item.text}`);
        }
        record(
          'content items have type:"text" and text:string',
          allValid,
          details.join('; ')
        );
      } else {
        record('content items have type:"text" and text:string', false, 'content array is empty or not array');
      }
    } else {
      record('content is array', false, 'No content field in result');
      record('content items have type:"text" and text:string', false, 'No content field');
    }

    // --- Test 3: isError field ---
    log('Test 3: Check isError field');
    if (resp.result) {
      if (resp.result.isError === false) {
        record('isError is false for successful call', true, 'isError: false');
      } else if (resp.result.isError === undefined) {
        record('isError is false for successful call', true, 'isError: undefined (acceptable)');
      } else {
        record('isError is false for successful call', false, `isError: ${resp.result.isError}`);
      }
    } else {
      record('isError is false for successful call', false, 'No result');
    }
  } catch (e) {
    record('Tool call returns result', false, `Exception: ${e.message}`);
    record('content is array', false, `Exception: ${e.message}`);
    record('content items have type:"text" and text:string', false, `Exception: ${e.message}`);
    record('isError is false for successful call', false, `Exception: ${e.message}`);
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
