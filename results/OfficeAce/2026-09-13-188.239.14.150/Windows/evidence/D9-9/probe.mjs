/**
 * D9-9 (P1): 工具描述完整性
 *
 * Tests:
 *  1. Get tools/list → check each tool has non-empty description
 *  2. Check each tool has inputSchema with at least type: "object"
 *  3. Check each tool has a non-empty name
 *
 * Expected: All tools have complete metadata
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
  log('=== D9-9: 工具描述完整性 ===');
  log('');

  const client = createMcpClient();

  // Initialize
  await client.call('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe', version: '1.0.0' },
  });

  // Get tools/list
  const resp = await client.call('tools/list', {});

  if (!resp.result || !resp.result.tools) {
    record('tools/list returns tools array', false, 'No tools in response');
    client.close();
    log(`Overall: FAIL`);
    process.exit(1);
  }

  const tools = resp.result.tools;
  log(`Total tools: ${tools.length}`);
  log('');

  // --- Test 1: Each tool has non-empty description ---
  log('Test 1: Check each tool has non-empty description');
  {
    const toolsWithoutDesc = [];
    const toolsWithEmptyDesc = [];
    for (const tool of tools) {
      if (tool.description === undefined || tool.description === null) {
        toolsWithoutDesc.push(tool.name);
      } else if (typeof tool.description !== 'string' || tool.description.trim() === '') {
        toolsWithEmptyDesc.push(tool.name);
      }
    }

    const passed = toolsWithoutDesc.length === 0 && toolsWithEmptyDesc.length === 0;
    let detail = `All ${tools.length} tools have non-empty descriptions`;
    if (toolsWithoutDesc.length > 0) detail += `. Missing description: ${toolsWithoutDesc.join(', ')}`;
    if (toolsWithEmptyDesc.length > 0) detail += `. Empty description: ${toolsWithEmptyDesc.join(', ')}`;
    record('All tools have non-empty description', passed, detail);
  }
  log('');

  // --- Test 2: Each tool has inputSchema with type: "object" ---
  log('Test 2: Check each tool has inputSchema with type: "object"');
  {
    const toolsWithoutSchema = [];
    const toolsWithBadSchemaType = [];
    for (const tool of tools) {
      if (!tool.inputSchema) {
        toolsWithoutSchema.push(tool.name);
      } else if (tool.inputSchema.type !== 'object') {
        toolsWithBadSchemaType.push(`${tool.name} (type: ${JSON.stringify(tool.inputSchema.type)})`);
      }
    }

    const passed = toolsWithoutSchema.length === 0 && toolsWithBadSchemaType.length === 0;
    let detail = `All ${tools.length} tools have inputSchema with type: "object"`;
    if (toolsWithoutSchema.length > 0) detail += `. Missing inputSchema: ${toolsWithoutSchema.join(', ')}`;
    if (toolsWithBadSchemaType.length > 0) detail += `. Bad schema type: ${toolsWithBadSchemaType.join(', ')}`;
    record('All tools have inputSchema with type:"object"', passed, detail);
  }
  log('');

  // --- Test 3: Each tool has non-empty name ---
  log('Test 3: Check each tool has non-empty name');
  {
    const toolsWithoutName = [];
    const toolsWithEmptyName = [];
    for (const tool of tools) {
      if (tool.name === undefined || tool.name === null) {
        toolsWithoutName.push(`index ${tools.indexOf(tool)}`);
      } else if (typeof tool.name !== 'string' || tool.name.trim() === '') {
        toolsWithEmptyName.push(`index ${tools.indexOf(tool)}`);
      }
    }

    const passed = toolsWithoutName.length === 0 && toolsWithEmptyName.length === 0;
    let detail = `All ${tools.length} tools have non-empty names`;
    if (toolsWithoutName.length > 0) detail += `. Missing name: ${toolsWithoutName.join(', ')}`;
    if (toolsWithEmptyName.length > 0) detail += `. Empty name: ${toolsWithEmptyName.join(', ')}`;
    record('All tools have non-empty name', passed, detail);
  }
  log('');

  // --- Test 4: List all tool names for completeness ---
  log('Test 4: List all tool names');
  for (const tool of tools) {
    log(`  - ${tool.name}: ${tool.description?.substring(0, 80) || '(no description)'}...`);
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
